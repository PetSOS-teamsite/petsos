# PetSOS Manual Test Checklist

## 📱 **WhatsApp Functionality Tests**

### Test 1: Emergency Broadcast via WhatsApp
**Goal:** Verify emergency broadcasts are sent via WhatsApp to multiple clinics

**Prerequisites:**
- Have at least one pet registered in your account
- Multiple clinics in database with WhatsApp numbers

**Steps:**
1. ✅ Log in to PetSOS
2. ✅ Navigate to Emergency page (/emergency)
3. ✅ Select a pet from your pet list
4. ✅ Enter emergency symptoms (e.g., "Dog having difficulty breathing")
5. ✅ Click "Find Nearby Clinics" or proceed to next step
6. ✅ Review clinic list (should show clinics with WhatsApp contact)
7. ✅ Click "Broadcast to All Clinics" or "Send Emergency Alert"
8. ✅ Wait for confirmation message

**Expected Results:**
- ✅ Success message appears: "Emergency broadcast sent to X clinics"
- ✅ Toast notification shows number of clinics contacted
- ✅ Can navigate to broadcast status page
- ✅ No error messages in browser console
- ✅ WhatsApp messages received by clinic phone numbers

**Check Message Content:**
- ✅ Contains pet name, species, breed
- ✅ Contains symptoms description
- ✅ Contains owner contact information
- ✅ Contains emergency timestamp
- ✅ Message is clear and professional

---

### Test 2: Individual Clinic WhatsApp Contact
**Goal:** Verify direct WhatsApp contact with individual clinics

**Steps:**
1. ✅ Navigate to Clinics page (/clinics)
2. ✅ Find a clinic with WhatsApp number listed
3. ✅ Look for WhatsApp icon/button next to clinic
4. ✅ Click the WhatsApp contact button

**Expected Results:**
- ✅ WhatsApp opens in new tab/window (web.whatsapp.com or WhatsApp app)
- ✅ Clinic phone number is pre-filled
- ✅ Phone number format is correct (+852XXXXXXXX for HK)
- ✅ Can send message to clinic directly

---

### Test 3: Message Delivery Status Tracking
**Goal:** Verify broadcast message status can be tracked

**Steps:**
1. ✅ After sending emergency broadcast, navigate to status page
2. ✅ Check message delivery status for each clinic
3. ✅ Look for status indicators (sent, delivered, failed)

**Expected Results:**
- ✅ Each clinic shows message status
- ✅ "Sent" status for successful WhatsApp messages
- ✅ "Failed" status with error message if WhatsApp unavailable
- ✅ Email fallback indicated when WhatsApp not available
- ✅ Timestamps shown for each message
- ✅ Can see which clinics received vs. failed

---

### Test 4: WhatsApp Error Handling
**Goal:** Test system behavior when WhatsApp fails

**Steps:**
1. ✅ Try broadcasting to a clinic without WhatsApp number
2. ✅ Check if system falls back to email
3. ✅ Verify error messages are user-friendly

**Expected Results:**
- ✅ System automatically uses email fallback
- ✅ User is notified which clinics received via email vs WhatsApp
- ✅ No crashes or blank error screens
- ✅ Messages logged in database with correct status

---

## 🔐 **Authentication Tests**

### Test 5: User Registration & Login
**Goal:** Verify all authentication methods work

**Google OAuth:**
1. ✅ Click "Log In / Sign Up"
2. ✅ Click "Continue with Google"
3. ✅ Select Google account
4. ✅ Redirected back to profile page
5. ✅ User name and email displayed correctly

**Email/Password Registration:**
1. ✅ Click "Sign up with Email"
2. ✅ Enter name, email, password
3. ✅ Click "Create Account"
4. ✅ Redirected to profile page
5. ✅ Can log out and log back in

**Email/Password Login:**
1. ✅ Click "Log in with Email"
2. ✅ Enter registered email and password
3. ✅ Click "Log In"
4. ✅ Successfully logged in

**Phone/Password Registration:**
1. ✅ Click "Sign up with Phone"
2. ✅ Select country code (+852 for HK)
3. ✅ Enter phone number
4. ✅ Enter name and password
5. ✅ Account created successfully

**Phone/Password Login:**
1. ✅ Click "Log in with Phone"
2. ✅ Select country code
3. ✅ Enter phone number and password
4. ✅ Successfully logged in

---

## 🐾 **Pet Management Tests**

### Test 6: Add New Pet
**Goal:** Verify pet creation works correctly

**Steps:**
1. ✅ Navigate to Pets page (/pets)
2. ✅ Click "Add New Pet"
3. ✅ Fill in pet details:
   - Name: Any name
   - Species: Dog/Cat
   - Breed: Select from dropdown (bilingual breeds)
   - Age: Any number
   - Weight: Any number
   - Gender: Male/Female
   - Medical notes: Optional
4. ✅ Click "Save" or "Add Pet"

**Expected Results:**
- ✅ Pet appears in pet list immediately
- ✅ All details saved correctly
- ✅ Breed shows in correct language (EN/ZH-HK)
- ✅ Can view pet details
- ✅ Success message shown

---

### Test 7: Edit Pet Information
**Goal:** Verify pet updates work

**Steps:**
1. ✅ Click "Edit" on existing pet
2. ✅ Change name, age, weight, or medical notes
3. ✅ Click "Save Changes"

**Expected Results:**
- ✅ Changes saved successfully
- ✅ Updated info displayed in pet list
- ✅ Success message shown

---

### Test 8: Delete Pet
**Goal:** Verify pet deletion works

**Steps:**
1. ✅ Click "Delete" on a pet
2. ✅ Confirm deletion in dialog
3. ✅ Check pet list

**Expected Results:**
- ✅ Pet removed from list
- ✅ Confirmation dialog shown before deletion
- ✅ Success message shown
- ✅ Cannot use deleted pet in emergency requests

---

## 🚨 **Emergency Request Flow Tests**

### Test 9: Complete Emergency Request Flow
**Goal:** Test entire emergency flow from start to finish

**Steps:**
1. ✅ Navigate to Emergency page
2. ✅ Select pet from dropdown
3. ✅ Enter symptoms clearly
4. ✅ (Optional) Record voice description
5. ✅ Click "Find Nearby Clinics"
6. ✅ Review clinic list (sorted by distance if GPS enabled)
7. ✅ Click "Broadcast to All" or select specific clinics
8. ✅ Confirm broadcast
9. ✅ View broadcast status

**Expected Results:**
- ✅ All steps complete smoothly
- ✅ Pet selection works
- ✅ Symptoms saved correctly
- ✅ Clinic list shows 24-hour clinics only (by default)
- ✅ Broadcast sends successfully
- ✅ Can track message delivery

---

### Test 10: Voice Recording (AI Analysis)
**Goal:** Test voice symptom recording and AI analysis

**Steps:**
1. ✅ On Emergency page, click voice recording button
2. ✅ Allow microphone access
3. ✅ Speak symptoms clearly (e.g., "My dog is vomiting and has diarrhea")
4. ✅ Stop recording
5. ✅ Wait for AI analysis

**Expected Results:**
- ✅ Recording works (shows recording indicator)
- ✅ Audio captured successfully
- ✅ AI analysis returns structured symptoms
- ✅ Symptoms auto-filled in text field
- ✅ Can edit AI-generated symptoms if needed

---

### Test 11: Emergency Without Login
**Goal:** Verify emergency access works for non-registered users

**Steps:**
1. ✅ Log out (if logged in)
2. ✅ Navigate to /emergency
3. ✅ Try to create emergency request
4. ✅ Enter symptoms
5. ✅ Proceed to find clinics

**Expected Results:**
- ✅ Can access emergency page without login
- ✅ Can enter symptoms
- ✅ Can view clinic list
- ✅ May have limited broadcast features (or prompted to register)

---

## 🏥 **Clinic Directory Tests**

### Test 12: Browse Clinics
**Goal:** Verify clinic directory displays correctly

**Steps:**
1. ✅ Navigate to /clinics
2. ✅ Scroll through clinic list
3. ✅ Check clinic information displayed

**Expected Results:**
- ✅ Clinics load successfully
- ✅ Each clinic shows: name, address, phone, WhatsApp, email
- ✅ 24-hour badge shown for 24-hour clinics
- ✅ GPS distance shown (if location enabled)
- ✅ Map links work

---

### Test 13: Clinic Search & Filters
**Goal:** Verify search and filtering work

**Steps:**
1. ✅ Use search box to search clinic name
2. ✅ Toggle "24-Hour Only" filter
3. ✅ Check if GPS location toggle works

**Expected Results:**
- ✅ Search filters clinics by name
- ✅ 24-Hour filter shows only 24-hour clinics
- ✅ 24-Hour filter is ON by default
- ✅ GPS toggle shows/hides distance
- ✅ Clinics sorted by distance when GPS enabled

---

### Test 14: GPS Location Features
**Goal:** Test GPS distance tracking

**Steps:**
1. ✅ Navigate to /clinics
2. ✅ Allow location access when prompted
3. ✅ Check for GPS status banner

**Expected Results:**
- ✅ Browser prompts for location permission
- ✅ Success banner shows when location obtained
- ✅ Clinics show distance (e.g., "2.3 km away")
- ✅ Clinics sorted by nearest first
- ✅ Error banner shows if location denied or fails
- ✅ Can still use app if location denied

---

### Test 15: Clinic Contact Methods
**Goal:** Verify all contact methods work

**Steps:**
1. ✅ Click "Call" button on clinic
2. ✅ Click "WhatsApp" button on clinic
3. ✅ Click "Email" link (if available)
4. ✅ Click "View on Map" or map icon

**Expected Results:**
- ✅ Call button opens phone dialer (tel: link)
- ✅ WhatsApp button opens WhatsApp with clinic number
- ✅ Email opens default email client
- ✅ Map link opens Google Maps with clinic location

---

## 🌐 **Internationalization (i18n) Tests**

### Test 16: Language Switching
**Goal:** Verify bilingual support works

**Steps:**
1. ✅ Click language switcher (globe icon in top right)
2. ✅ Switch to 繁體中文 (Traditional Chinese)
3. ✅ Navigate through different pages
4. ✅ Switch back to English
5. ✅ Check all pages again

**Expected Results:**
- ✅ Language switches immediately
- ✅ All UI text translates correctly
- ✅ Button labels in correct language
- ✅ Form labels and placeholders translated
- ✅ Error messages in correct language
- ✅ Pet breeds show correct Chinese names (e.g., 唐狗 for Mixed Breed)
- ✅ Emergency flow uses 毛孩 (furry kids) instead of 寵物
- ✅ Language preference persists across page navigation

---

## 👨‍💼 **Admin Dashboard Tests**

### Test 17: Admin Login & Access
**Goal:** Verify admin features are accessible

**Steps:**
1. ✅ Log in with admin account (ansonlabfornone@gmail.com)
2. ✅ Navigate to Admin Dashboard
3. ✅ Check admin menu options

**Expected Results:**
- ✅ Admin can access /admin route
- ✅ Regular users cannot access admin pages
- ✅ Admin menu shows all admin features

---

### Test 18: Clinic Management (Admin)
**Goal:** Test CRUD operations for clinics

**Add Clinic:**
1. ✅ Click "Add New Clinic"
2. ✅ Fill in all clinic details
3. ✅ Use GPS auto-fill for coordinates
4. ✅ Save clinic

**Edit Clinic:**
1. ✅ Click "Edit" on existing clinic
2. ✅ Modify details
3. ✅ Save changes

**Delete Clinic:**
1. ✅ Click "Delete" on clinic
2. ✅ Confirm deletion
3. ✅ Verify removal

**Expected Results:**
- ✅ All CRUD operations work
- ✅ GPS auto-fill works for addresses
- ✅ Validation prevents invalid data
- ✅ Changes reflect immediately

---

### Test 19: Multi-Region Configuration (Admin)
**Goal:** Test country, region, and breed management

**Steps:**
1. ✅ Navigate to Admin Config page
2. ✅ Add/edit countries
3. ✅ Add/edit regions
4. ✅ Add/edit pet breeds
5. ✅ Test bilingual translations

**Expected Results:**
- ✅ Can create countries with phone codes, flags
- ✅ Can create regions linked to countries
- ✅ Can create breeds (Dog/Cat specific)
- ✅ Translations work (EN/ZH-HK)
- ✅ Changes appear in dropdowns immediately

---

## 🏪 **Clinic Staff Dashboard Tests**

### Test 20: Clinic Staff Access
**Goal:** Verify clinic staff features

**Steps:**
1. ✅ Log in as clinic staff user
2. ✅ Navigate to Clinic Dashboard
3. ✅ Check available features

**Expected Results:**
- ✅ Staff can access their clinic's dashboard only
- ✅ Cannot access other clinics' data
- ✅ Can view emergency requests sent to their clinic

---

### Test 21: Clinic Availability Toggle
**Goal:** Test 24-hour availability toggle

**Steps:**
1. ✅ On clinic dashboard, find availability toggle
2. ✅ Toggle "24-Hour Service" ON
3. ✅ Toggle OFF
4. ✅ Check if reflected in public clinic directory

**Expected Results:**
- ✅ Toggle works instantly
- ✅ Changes saved to database
- ✅ Clinic appears/disappears from 24-hour filter
- ✅ Badge updates on clinic listings

---

## 🔒 **Security & Privacy Tests**

### Test 22: Data Privacy Compliance
**Goal:** Verify GDPR/PDPO compliance features

**Steps:**
1. ✅ Navigate to Privacy Policy page
2. ✅ Check cookie consent banner
3. ✅ Accept/decline cookies
4. ✅ Check Terms of Service page

**Expected Results:**
- ✅ Privacy Policy page loads and is readable
- ✅ Cookie consent appears on first visit
- ✅ Choice persists (accept/decline)
- ✅ Google Analytics respects consent
- ✅ Terms of Service accessible

---

### Test 23: Data Export & Deletion
**Goal:** Test user data rights

**Steps:**
1. ✅ Navigate to Profile page
2. ✅ Look for "Export My Data" option
3. ✅ Click and download data export
4. ✅ Look for "Delete My Account" option
5. ✅ Test account deletion flow

**Expected Results:**
- ✅ Data export generates JSON/CSV file
- ✅ Export contains all user data
- ✅ Deletion requires confirmation
- ✅ Account and data deleted completely
- ✅ Cannot log in after deletion

---

## 📱 **Mobile Responsiveness Tests**

### Test 24: Mobile Layout
**Goal:** Verify app works on mobile devices

**Steps:**
1. ✅ Open petsos.site on mobile phone (or use browser DevTools mobile view)
2. ✅ Navigate through all pages
3. ✅ Test all features

**Expected Results:**
- ✅ Landing page displays correctly on mobile
- ✅ Buttons are tappable (not too small)
- ✅ Forms work on mobile
- ✅ No horizontal scrolling
- ✅ Navigation menu works
- ✅ Emergency flow works on mobile
- ✅ WhatsApp buttons work on mobile

---

## 🌐 **SEO & Branding Tests**

### Test 25: SEO Meta Tags
**Goal:** Verify SEO optimization

**Steps:**
1. ✅ Open petsos.site
2. ✅ View page source (right-click → View Page Source)
3. ✅ Check for meta tags
4. ✅ Navigate to different pages and repeat

**Expected Results:**
- ✅ Each page has unique title tag
- ✅ Meta description present and relevant
- ✅ Open Graph tags (og:title, og:description, og:url, og:image)
- ✅ Twitter Card tags
- ✅ Theme color: #EF4444
- ✅ Geo tags for Hong Kong

---

### Test 26: Favicon & Branding
**Goal:** Verify visual branding

**Steps:**
1. ✅ Check browser tab icon
2. ✅ Check mobile home screen icon
3. ✅ Check brand colors throughout site

**Expected Results:**
- ✅ Custom favicon visible (red emergency cross + paw print)
- ✅ NOT generic default icon
- ✅ Red theme (#EF4444) consistent across pages
- ✅ PetSOS branding clear and professional

---

## 🐛 **Error Handling Tests**

### Test 27: Network Errors
**Goal:** Test behavior when network fails

**Steps:**
1. ✅ Disconnect internet
2. ✅ Try to submit emergency request
3. ✅ Reconnect and retry

**Expected Results:**
- ✅ User-friendly error message shown
- ✅ No blank screens or crashes
- ✅ Retry option available

---

### Test 28: Invalid Input Handling
**Goal:** Test form validation

**Steps:**
1. ✅ Try to submit forms with empty required fields
2. ✅ Enter invalid email format
3. ✅ Enter invalid phone number
4. ✅ Enter negative age/weight

**Expected Results:**
- ✅ Validation errors shown clearly
- ✅ Fields highlighted in red
- ✅ Helpful error messages
- ✅ Cannot submit invalid data

---

### Test 29: 404 Error Page
**Goal:** Test non-existent routes

**Steps:**
1. ✅ Navigate to https://petsos.site/nonexistent-page
2. ✅ Check what displays

**Expected Results:**
- ✅ Custom 404 page shown
- ✅ Navigation still works
- ✅ Can return to home

---

## 📊 **Analytics & Monitoring Tests**

### Test 30: Google Analytics
**Goal:** Verify tracking works

**Steps:**
1. ✅ Accept cookies on landing page
2. ✅ Navigate through multiple pages
3. ✅ Trigger emergency request
4. ✅ Check Google Analytics dashboard (if you have access)

**Expected Results:**
- ✅ Page views tracked
- ✅ Events tracked (emergency request, broadcast, etc.)
- ✅ No tracking if cookies declined
- ✅ User privacy respected

---

## ✅ **Final Integration Test**

### Test 31: Complete User Journey
**Goal:** Test realistic end-to-end scenario

**Steps:**
1. ✅ New user visits petsos.site
2. ✅ Reads landing page, switches language
3. ✅ Registers account (Google/Email/Phone)
4. ✅ Adds 2 pets to profile
5. ✅ Edits one pet's details
6. ✅ Creates emergency request for first pet
7. ✅ Records voice symptoms (if available)
8. ✅ Reviews symptoms from AI
9. ✅ Finds nearby clinics
10. ✅ Broadcasts emergency to all clinics
11. ✅ Checks broadcast status
12. ✅ Contacts individual clinic via WhatsApp
13. ✅ Logs out
14. ✅ Logs back in
15. ✅ All data persists

**Expected Results:**
- ✅ Entire flow works smoothly
- ✅ No errors or crashes
- ✅ Data persists across sessions
- ✅ All features work as expected
- ✅ WhatsApp messages sent successfully
- ✅ Professional, polished experience

---

## 🔧 **Performance Tests**

### Test 32: Load Time
**Goal:** Ensure pages load quickly

**Expected Results:**
- ✅ Landing page loads in < 3 seconds
- ✅ Clinic list loads in < 5 seconds
- ✅ No long loading spinners
- ✅ Images load properly

---

### Test 33: Database Performance
**Goal:** Test with realistic data volume

**Expected Results:**
- ✅ Clinic search works with 191 clinics
- ✅ No lag when scrolling clinic list
- ✅ GPS distance calculation fast
- ✅ Broadcast to 50+ clinics completes quickly

---

## 📝 **Testing Checklist Summary**

### Critical Features (Must Work):
- [ ] WhatsApp emergency broadcast
- [ ] User authentication (all methods)
- [ ] Pet management (add/edit/delete)
- [ ] Emergency request flow
- [ ] Clinic directory with GPS
- [ ] Language switching (EN/ZH-HK)

### Important Features (Should Work):
- [ ] Voice recording & AI analysis
- [ ] Individual clinic WhatsApp contact
- [ ] 24-hour filter (default ON)
- [ ] Admin dashboard
- [ ] Clinic staff dashboard
- [ ] SEO meta tags
- [ ] Custom favicon

### Nice-to-Have Features:
- [ ] Cookie consent
- [ ] Data export
- [ ] Google Analytics
- [ ] Mobile responsiveness
- [ ] Error handling

---

## 🎯 **Bug Severity Classification**

**Critical (P0) - Fix Immediately:**
- App crashes or won't load
- Cannot log in at all
- WhatsApp broadcast completely broken
- Database errors preventing core features
- Security vulnerabilities

**High (P1) - Fix Within 24 Hours:**
- WhatsApp fails for some clinics
- GPS location not working
- Pet creation/editing broken
- Emergency request cannot be submitted
- Admin functions not accessible

**Medium (P2) - Fix Within Week:**
- Language switching issues
- UI layout problems
- Search/filter not working
- Minor data display issues
- Analytics not tracking

**Low (P3) - Fix When Possible:**
- Typos in text
- Minor styling inconsistencies
- Non-critical feature enhancements
- Performance optimizations

---

## 📞 **WhatsApp-Specific Debug Checklist**

If WhatsApp isn't working, check:

1. **Credentials:**
   - [ ] WHATSAPP_ACCESS_TOKEN exists and is valid
   - [ ] WHATSAPP_PHONE_NUMBER_ID exists and is correct
   - [ ] Token hasn't expired

2. **Phone Numbers:**
   - [ ] Clinic WhatsApp numbers in correct format (+852XXXXXXXX)
   - [ ] No spaces or special characters except +
   - [ ] Numbers are verified with Meta

3. **API Status:**
   - [ ] Check Meta Business Suite for API status
   - [ ] Check rate limits not exceeded
   - [ ] Check message templates approved (if using templates)

4. **Console Logs:**
   - [ ] Check browser console for errors
   - [ ] Check server logs for WhatsApp API responses
   - [ ] Look for 401/403 errors (auth issues)
   - [ ] Look for 400 errors (invalid phone numbers)

5. **Testing Mode:**
   - [ ] TESTING_MODE is false in production
   - [ ] Test numbers receive messages in testing mode

---

## 🎉 **Testing Complete!**

After completing this checklist, you should have confidence that:
- ✅ WhatsApp integration works end-to-end
- ✅ All critical features function properly
- ✅ User experience is smooth and professional
- ✅ App is ready for production use

**Remember:** Test on both desktop and mobile, in both English and Traditional Chinese!
