# S'Maris Designs website starter

## Included pages
- index.html — Homepage
- about.html — Brand story and values
- collections.html — Women's fashion collection gallery with category filters
- custom-orders.html — Custom design enquiry form
- contact.html — Contact details and enquiry form

## Preview
Open `index.html` in a browser, or upload the folder contents to your web host.

## Important before publishing
1. Replace the sample fashion photography with S'Maris Designs' own licensed photographs.
2. Confirm the brand's real email, WhatsApp number, address and social media URLs.
3. Connect the custom-order and contact forms to a backend/form service. They are front-end demos and do not transmit or store submissions.
4. Add real product names, prices, sizing, delivery and return policies if online checkout is required.
5. Review the copy and categories with the business owner.

The site uses Google Fonts and remote Unsplash image URLs, so those assets need an internet connection. You may download properly licensed images and host them locally for production.


ORDER SYSTEM UPDATE
- custom-orders.html now submits orders to Supabase after configuration.
- admin.html is the private staff order manager.
- supabase-setup.sql creates the tables, access policies and private image bucket.
- Follow SUPABASE-SETUP.md to activate the backend.
- Orders are requests requiring business confirmation; no online payment is processed yet.

Email delivery: Contact enquiries and custom-order notifications are configured for Terabeautystella@gmail.com using FormSubmit. The first test submission requires clicking the verification link sent by FormSubmit to that inbox. Supabase still needs project credentials and SQL setup for permanent order storage and admin dashboard functionality.
