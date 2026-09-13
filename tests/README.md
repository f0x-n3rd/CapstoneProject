# Testing this working branch

This branch connects Firebase registration/login and resident profiles, plus admin announcement creation/deletion with Supabase images. Reports and analytics are still prototypes. Report submissions/private image access and full offline viewing are not ready. Image styling is deferred.

## Use a separate copy

```sh
git clone --branch neji_review_fixes --single-branch https://github.com/f0x-n3rd/CapstoneProject.git CapstoneProject-testing
```

This downloads the test branch into a new folder without changing your existing project. Open that folder in VS Code and open `index.html` using Live Server. No package installation is needed for browser testing. Use the same host, port and browser tab while navigating.

Do not merge, push, change Firebase/Supabase settings, or run deployment/setup SQL merely to test. The checked-in public configuration points to the team's shared test services. Test accounts and announcements created here are real records in those services.

## Resident-only checks

1. Register your own test account. Do not share the password. No admin document should be created for this account.
2. Confirm Account shows the name, email and barangay you entered.
3. Navigate among Home, Account and Track Reports. Temporary profile-loading failures should not send a signed-in user back to login.
4. Confirm published announcements and their images appear on Home and Announcement. Coordinate with the designated admin to create/delete a clearly labeled test announcement; confirm changes appear live.
5. Use the existing Account Log-out button. Confirm private resident pages redirect to login when opened signed out.
6. Try your resident-only credentials at `admin_interface/admin_login/admin.html`. Expect rejection. Then sign back into the resident interface if needed (a failed admin role check signs that session out).

UI denial does not prove server-side permissions. Live direct-request unauthorized Firestore/Storage checks remain pending; coordinate those separately rather than testing against someone else's data.

## Designated admin checks

Use only an account explicitly designated by the project owner. Create an announcement labeled TEST with a small JPEG, PNG or WebP (at most 5 MB). Confirm resident display, delete that test announcement, and confirm it disappears. The project owner can confirm the corresponding image was removed from the bucket.

The owner has already verified registration/profile/logout, admin login, image announcement creation, resident live display, deletion and bucket cleanup in the shared environment. Please independently report any failures.

## Report a bug

Send: page and action, expected result, actual result, browser, and relevant error text. Firefox Console's Persist Logs can retain errors across navigation. Do not include passwords, bearer tokens, or private keys.

## Automated server-handler tests

With Node 22.18+ (tested here using Node 26):

```sh
node tests/image-storage.test.mjs
```

These 25 tests use simulated upstream responses and do not write to the cloud. They cover authorization rejection, admin revocation, image validation, path/bucket restrictions, and failure handling. A Node module-type warning may appear because this browser project has no package.json; the test pass/fail output is separate.

For maintainers setting up a different environment, see `firebase/SETUP.md` and `supabase/SETUP.md`. Those provisioning instructions are not required for the teammate testing the existing shared environment.
