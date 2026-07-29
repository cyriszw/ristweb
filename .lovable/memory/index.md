Marist Brothers High School Dete - school website with blue/white theme, Supabase backend

## Design System
- Primary: HSL 215 70% 35% (deep blue)
- Secondary/Accent: HSL 200 60% 55% (light blue)
- Background: White
- Fonts: Playfair Display (display), Source Sans 3 (body)
- School motto: "Scientia et Virtus"

## Database Tables
posts, gallery, files, events, messages, clubs, sports, innovations, innovation_images, site_settings, user_roles, visitor_logs, fees

## Auth
- Roles stored in user_roles table (app_role enum: admin, user)
- has_role() security definer function for RLS
- Auto-creates 'user' role on signup via trigger

## Routes
/, /about, /academics, /admissions, /news, /gallery, /clubs, /clubs/:id, /innovation-hub, /innovation-hub/:id, /sports, /sports/:id, /contact, /fees, /login, /admin

## Features
- Dynamic club/sport detail pages at /clubs/:id and /sports/:id
- Admin-controlled page banners stored in site_settings (banner_about, banner_news, etc.)
- Loading spinners on all data-fetching pages
- Real-time subscriptions on home, clubs, sports, gallery, news, fees pages
- Image cropping (react-easy-crop) on all admin uploads: posts 16:9, clubs 16:9, sports 16:9, gallery 1:1, banners 21:9, innovations 16:9
- Fees page with admin CRUD, PDF attachments, realtime updates

## Admin Setup
To make a user admin, insert into user_roles (user_id, role) values ('uuid', 'admin');
