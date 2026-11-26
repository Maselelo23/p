import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const supabase = createClient(
  "https://frjsrejozvbnpjorjaaa.supabase.co",
  "sb_publishable_XFVfa_mVigCZDZBBk1Z67A_1Ss2gDV4"
);

const form = document.querySelector("form");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const buttons = [...document.querySelectorAll("button")];
const googleButton = buttons.find((button) => button.textContent.includes("Google"));
const forgotButton = buttons.find((button) => button.textContent.includes("Forgot"));
const submitButton = form?.querySelector('button[type="submit"]');

const status = document.createElement("p");
status.id = "auth-status";
status.className = "text-sm text-center";
status.setAttribute("role", "status");
status.setAttribute("aria-live", "polite");
form?.after(status);

function showMessage(message, isError = false) {
  status.textContent = message;
  status.className = isError
    ? "text-sm text-center text-red-600"
    : "text-sm text-center text-green-700";
}

function setBusy(busy, label) {
  if (!submitButton) return;
  submitButton.disabled = busy;
  submitButton.textContent = busy ? label : "Sign in";
}

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  showMessage("");
  setBusy(true, "Signing in…");

  const { data, error } = await supabase.auth.signInWithPassword({
    email: emailInput.value.trim(),
    password: passwordInput.value
  });

  setBusy(false);
  if (error) {
    showMessage(
      error.message.includes("Invalid login credentials")
        ? "The email or password is incorrect. Please try again."
        : error.message,
      true
    );
    return;
  }

  showMessage("Sign-in successful. Your PLRK account is authenticated.");
  passwordInput.value = "";
});

forgotButton?.addEventListener("click", async () => {
  const email = emailInput.value.trim();
  if (!email) {
    showMessage("Enter your email address first, then choose Forgot your password.", true);
    emailInput.focus();
    return;
  }

  forgotButton.disabled = true;
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: "https://plrk.co.za/auth.html"
  });
  forgotButton.disabled = false;

  if (error) {
    showMessage(error.message, true);
  } else {
    showMessage("If an account exists for that email, a password-reset link will be sent.");
  }
});

googleButton?.addEventListener("click", () => {
  showMessage("Google sign-in has not been configured for PLRK yet.", true);
});

supabase.auth.onAuthStateChange(async (event) => {
  if (event === "PASSWORD_RECOVERY") {
    const newPassword = window.prompt("Enter your new PLRK password (at least 8 characters):");
    if (!newPassword) {
      showMessage("Password change cancelled.", true);
      return;
    }
    if (newPassword.length < 8) {
      showMessage("Your password must be at least 8 characters.", true);
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) showMessage(error.message, true);
    else showMessage("Your password has been updated. You can now sign in.");
    await supabase.auth.signOut();
  }
});
