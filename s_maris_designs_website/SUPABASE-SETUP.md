# Activate customer orders for S'Maris Designs

The website now includes an order submission flow and a private staff order manager. The database connection still needs to be configured in the owner's Supabase account; no credentials have been supplied or embedded.

## 1. Create the database
1. Create a project at https://supabase.com/.
2. Open **SQL Editor → New query**.
3. Paste and run all of `supabase-setup.sql`.

## 2. Add browser connection settings
1. In Supabase open **Project Settings → API** (or API Keys).
2. Copy the Project URL and the publishable/anon public key.
3. Paste them into `assets/supabase-config.js` replacing the two `YOUR_...` values.
4. Never paste the `service_role` or secret key into website files.

## 3. Create the staff login and grant admin access
1. In Supabase open **Authentication → Users** and add the business owner's email as a user. Set a strong password.
2. Copy that user's UUID.
3. In SQL Editor run this, replacing the placeholder UUID:

```sql
insert into public.staff_roles (user_id, role)
values ('PASTE-AUTH-USER-UUID-HERE', 'admin')
on conflict (user_id) do update set role='admin';
```

4. Open `admin.html` on the deployed site and sign in with that email/password. Do not link the admin page in the public navigation; the database policies protect order records even if someone knows its URL.

## 4. Publish
Upload the complete folder contents to a static host (Netlify, Vercel, GitHub Pages or your existing host). Keep `assets/`, all HTML files and `supabase-setup.sql` together. Test a real order and verify it appears in `admin.html`.

## Email notifications configured

The custom-order form now sends order details to `Terabeautystella@gmail.com` through FormSubmit. The Contact page form also sends enquiries to that inbox. On the first submission, FormSubmit sends a verification email to this address; open it and click the activation link before expecting future notifications. Test both forms after activation.

The custom-order email contains the text details. Reference image uploads are not attached to the email in this version; the existing Supabase storage upload can be enabled after database setup.

## What works after setup
- Customers submit an order request with contact, category, desired date, measurements and design notes.
- Order records are stored in Supabase and receive an order number.
- Optional inspiration images are uploaded to a private storage bucket (5 MB max).
- Staff sign in at `admin.html`, review orders and update their status.

## Important business workflow notes
- This is an **order request and confirmation workflow**, not card checkout. The team must confirm availability, final price, delivery terms and any deposit with the customer.
- Online card payments can be added later using a payment provider and a server-side checkout function. Do not collect card numbers in these forms.
- FormSubmit is used for staff email notifications. For a production workflow with customer autoresponses and more control, move notifications to a server-side Supabase Edge Function and a transactional email provider. Do not expose email-provider API keys in browser JavaScript.
- Review the privacy notice, retention policy and customer consent wording for the business's operating location before launch.
- The current storage upload policy permits anonymous uploads to the private bucket. Add rate limiting / CAPTCHA and stronger upload abuse controls before promoting the form publicly.
