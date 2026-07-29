-- Application Tracking Accounts (password-based auth for applicants)
CREATE TABLE public.application_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES public.admission_applications(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  tracking_token TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_login TIMESTAMP WITH TIME ZONE
);
CREATE UNIQUE INDEX idx_app_tracking_application ON public.application_tracking(application_id);
CREATE UNIQUE INDEX idx_app_tracking_username ON public.application_tracking(username);
CREATE INDEX idx_app_tracking_token ON public.application_tracking(tracking_token);

-- Application Status History
CREATE TABLE public.application_statuses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES public.admission_applications(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('submitted','under_review','additional_info_required','interview_scheduled','accepted','rejected')),
  notes TEXT,
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
CREATE INDEX idx_app_statuses_app ON public.application_statuses(application_id);

-- Applicant-Admin Chat Messages
CREATE TABLE public.application_chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES public.admission_applications(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('applicant','admin')),
  sender_id UUID REFERENCES auth.users(id),
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
CREATE INDEX idx_chat_app ON public.application_chat_messages(application_id);
CREATE INDEX idx_chat_unread ON public.application_chat_messages(application_id, is_read) WHERE is_read = false;

-- Application Attachments
CREATE TABLE public.application_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES public.admission_applications(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER NOT NULL DEFAULT 0,
  file_type TEXT NOT NULL DEFAULT 'application/octet-stream',
  uploaded_by TEXT NOT NULL CHECK (uploaded_by IN ('applicant','admin')),
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
CREATE INDEX idx_attachments_app ON public.application_attachments(application_id);

-- Activity Log
CREATE TABLE public.application_activity_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES public.admission_applications(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details TEXT,
  performed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
CREATE INDEX idx_activity_app ON public.application_activity_log(application_id);

-- Notifications
CREATE TABLE public.application_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES public.admission_applications(id) ON DELETE CASCADE,
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('applicant','admin')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
CREATE INDEX idx_notif_app ON public.application_notifications(application_id);
CREATE INDEX idx_notif_recipient ON public.application_notifications(recipient_type, is_read);

-- Initial Status Trigger: Insert 'submitted' status when tracking is created
CREATE OR REPLACE FUNCTION public.create_initial_application_status()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.application_statuses (application_id, status)
  VALUES (NEW.application_id, 'submitted');

  INSERT INTO public.application_notifications (application_id, recipient_type, title, message)
  VALUES (NEW.application_id, 'admin', 'New Application Submitted', 'A new application has been submitted and is ready for review.');

  INSERT INTO public.application_activity_log (application_id, action, details)
  VALUES (NEW.application_id, 'application_submitted', 'Application submitted and tracking account created');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_create_initial_status
  AFTER INSERT ON public.application_tracking
  FOR EACH ROW
  EXECUTE FUNCTION public.create_initial_application_status();

-- Status Change Notification Trigger
CREATE OR REPLACE FUNCTION public.notify_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.application_notifications (application_id, recipient_type, title, message)
    VALUES (
      NEW.application_id,
      'applicant',
      'Application Status Updated',
      'Your application status has been changed to: ' || REPLACE(NEW.status, '_', ' ')
    );

    INSERT INTO public.application_activity_log (application_id, action, details)
    VALUES (NEW.application_id, 'status_changed', 'Status changed to: ' || NEW.status);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS
ALTER TABLE public.application_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Public can insert/select tracking (for login)
CREATE POLICY "Anyone can lookup tracking by username" ON public.application_tracking
  FOR SELECT USING (true);

CREATE POLICY "Applicants can select own statuses via tracking token" ON public.application_statuses
  FOR SELECT USING (
    application_id IN (
      SELECT application_id FROM public.application_tracking WHERE tracking_token = current_setting('app.tracking_token', true)
    )
  );

CREATE POLICY "Admins manage statuses" ON public.application_statuses
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Chat policies
CREATE POLICY "Applicants read own chat" ON public.application_chat_messages
  FOR SELECT USING (
    application_id IN (
      SELECT application_id FROM public.application_tracking WHERE tracking_token = current_setting('app.tracking_token', true)
    )
  );

CREATE POLICY "Applicants insert own chat" ON public.application_chat_messages
  FOR INSERT WITH CHECK (
    sender_type = 'applicant' AND
    application_id IN (
      SELECT application_id FROM public.application_tracking WHERE tracking_token = current_setting('app.tracking_token', true)
    )
  );

CREATE POLICY "Admins manage chat" ON public.application_chat_messages
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Attachment policies
CREATE POLICY "Applicants read own attachments" ON public.application_attachments
  FOR SELECT USING (
    is_deleted = false AND
    application_id IN (
      SELECT application_id FROM public.application_tracking WHERE tracking_token = current_setting('app.tracking_token', true)
    )
  );

CREATE POLICY "Applicants insert own attachments" ON public.application_attachments
  FOR INSERT WITH CHECK (
    uploaded_by = 'applicant' AND
    application_id IN (
      SELECT application_id FROM public.application_tracking WHERE tracking_token = current_setting('app.tracking_token', true)
    )
  );

CREATE POLICY "Admins manage attachments" ON public.application_attachments
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Activity log policies
CREATE POLICY "Applicants read own activity" ON public.application_activity_log
  FOR SELECT USING (
    application_id IN (
      SELECT application_id FROM public.application_tracking WHERE tracking_token = current_setting('app.tracking_token', true)
    )
  );

CREATE POLICY "Admins manage activity log" ON public.application_activity_log
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Notification policies
CREATE POLICY "Applicants read own notifications" ON public.application_notifications
  FOR SELECT USING (
    recipient_type = 'applicant' AND
    application_id IN (
      SELECT application_id FROM public.application_tracking WHERE tracking_token = current_setting('app.tracking_token', true)
    )
  );

CREATE POLICY "Applicants update own notifications" ON public.application_notifications
  FOR UPDATE USING (
    recipient_type = 'applicant' AND
    application_id IN (
      SELECT application_id FROM public.application_tracking WHERE tracking_token = current_setting('app.tracking_token', true)
    )
  );

CREATE POLICY "Admins manage notifications" ON public.application_notifications
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Helper function to set tracking token
CREATE OR REPLACE FUNCTION public.set_tracking_token(token TEXT)
RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.tracking_token', token, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
