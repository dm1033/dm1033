# Forms, File Upload & Booking Setup

The site is static (no backend), so forms post to **Formspree** and booking uses **Calendly**. Both have workable free tiers; suggested paid tiers noted below.

## A. Formspree (contact + CV upload + checklist forms)

The site expects three forms, configured in `src/lib/site.ts`:

```ts
forms: {
  upload:    "https://formspree.io/f/REPLACE_UPLOAD_FORM_ID",    // CV upload + enquiry
  contact:   "https://formspree.io/f/REPLACE_CONTACT_FORM_ID",   // contact page
  checklist: "https://formspree.io/f/REPLACE_CHECKLIST_FORM_ID", // lead magnet signups
},
```

### Setup
1. Create an account at https://formspree.io with the business email.
2. Create three forms: **CV Upload**, **Contact**, **Checklist** → copy each endpoint (`https://formspree.io/f/abcdwxyz`) into `site.ts`.
3. **File uploads** (the CV file field, named `upload`) require a **paid Formspree plan** (Gold). Until then, the upload form shows users a fallback message telling them to email the CV directly — this is automatic while the placeholder URL is present, but once you connect a free-plan form, either upgrade or remove the file field from `src/components/UploadForm.tsx`.
4. In each form's settings:
   - Set notification email (where submissions arrive).
   - Enable reCAPTCHA/spam filtering.
   - Set a redirect or keep AJAX (the site uses AJAX and shows its own success state — no redirect needed).
5. GDPR: in Formspree settings, note their data retention; mention Formspree as a processor in the privacy policy (already templated — just confirm the name).

### Alternatives
- **Netlify Forms** — if deploying to Netlify; supports uploads on paid tiers; change the form components to use `data-netlify` attributes instead of fetch.
- **Tally / Typeform** — embed or link a hosted form instead; quickest path for rich file upload (Tally's free tier includes uploads). To use: create the form there, then replace the form section of `/upload-cv` with an embed/link.

### Secure CV handling rules (whatever provider you choose)
- HTTPS only (all the above are).
- Forward to a mailbox only you control; enable 2FA on it.
- Download CVs to one organised, access-controlled folder; delete from the inbox.
- Delete client files after the retention period stated in the privacy policy.

## B. Calendly (booking calls)

1. Create https://calendly.com account → New event type: **"Construction Career Call — 60 min"** (and optionally 45 min).
2. Settings worth enabling: buffer time after calls, minimum 24h notice, custom questions ("Current role", "Target role", "What do you want from the call?", "LinkedIn URL").
3. Connect your video tool (Google Meet/Zoom/Teams) and calendar.
4. Copy your link into `src/lib/site.ts`:

```ts
calendly: "https://calendly.com/your-handle/career-call",
```

5. Payment-first flow: clients pay via the Stripe link, then book. (Calendly paid tiers can collect Stripe payment at booking time — a cleaner upgrade later.)

## C. Email notifications
- Formspree emails you each submission; Calendly emails bookings; Stripe emails payments. That's the whole notification stack with zero backend.
- Create three mailbox filters/labels (Orders / Enquiries / Bookings) so nothing is missed.
- Optional: pipe all three into a free Notion/Sheets board via Zapier/Make for order tracking — or use the local `/admin` tracker page in the meantime.

## D. Where the consent wording lives
The CV upload form already includes the required consent checkbox:
> "I confirm I have permission to share this CV and understand that the review is advisory and does not guarantee interviews, offers or selection."

Don't remove it — it's part of the GDPR + compliance posture, and submissions without it cannot be sent.
