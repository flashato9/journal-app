![[register_screen_photo.png|152]]

**What do I lose if I don't have a register screen?**

- No way to lock the app itself — if I hand someone my phone, they can get into my private journal even though the phone is already locked. **This is the actual load-bearing reason.**
- No profile picture.
- No username.
  The username and profile picture are secondary — things that came along for the ride because building an "account" was the standard shape for solving the real problem. The real problem was never "who are you," it was "someone with my unlocked phone shouldn't be able to read this."

## E2E Test: Register Flow

Automated flow (`.maestro/execute_register_flow.yaml`) that registers a new user end-to-end: captures a profile picture via the camera, fills in a matching username/password, selects Password as the auth method, and confirms the app lands on Login already signed in as the new user.

### 1. Upload Picture

Taps the profile picture placeholder, opens the camera, captures a photo, and confirms it. Asserts the upload prompt closes and the captured photo becomes the profile picture.

![[01-upload-picture.png]]

### 2. Enter Username

Taps the Username field and types `e2etestuser`.

![[02-enter-username.png]]

### 3. Enter Password

Taps the Password field and types the test password.

![[03-enter-password.png]]

### 4. Enter Confirm Password

Taps the Confirm Password field, retypes the same password, and dismisses the keyboard. Asserts the passwords match (no "Passwords do not match" error shown).

![[04-enter-confirm-password.png]]

### 5. Submit Register Form

Opens the Auth Method dropdown, selects Password, taps Register, confirms the Success dialog, and asserts the app lands back on Login already signed in as the new user.

![[05-submit-register-form.png]]
