import { Link } from "react-router-dom";
import { Controller, useForm } from "react-hook-form";
import { useState } from "react";
import Button from "../../../components/ui/Button";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import { InputField } from "../../../components/ui/InputField";
import { apiRequest } from "../../../services/api";

type FormData = { email: string };

export default function ForgotPassword() {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: { email: "" },
  });

  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMessage, setDialogMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await apiRequest<{ message: string }>(
        "/api/auth/forgot-password",
        "POST",
        { email: data.email },
      );

      setIsSuccess(true);
      setDialogMessage(
        "Reset link sent to your email. Please check inbox or spam.",
      );
      setDialogOpen(true);
    } catch (e: unknown) {
      let message = "Failed to send reset link";
      if (e instanceof Error) message = e.message;
      else if (typeof e === "string") message = e;

      setIsSuccess(false);
      setDialogMessage(message);
      setDialogOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const close = () => setDialogOpen(false);

  return (
    <>
      <div className="relative flex min-h-[100dvh] items-center justify-center overflow-x-hidden overflow-y-auto px-4 py-4 lg:py-3">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(15,118,110,0.16),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(217,119,6,0.12),transparent_24%)]" />

        <div className="float-in relative my-auto grid w-full max-w-5xl overflow-hidden rounded-[34px] border border-[rgba(123,97,63,0.12)] bg-[rgba(255,252,246,0.9)] shadow-[0_30px_70px_rgba(33,29,22,0.12)] backdrop-blur lg:max-h-[calc(100dvh-1.5rem)] lg:grid-cols-[1.05fr_0.95fr]">
          <div className="hidden bg-[linear-gradient(160deg,#0f766e_0%,#115e59_45%,#134e4a_100%)] p-8 text-white lg:block lg:overflow-y-auto">
            <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-white/70">
              Account Recovery
            </p>
            <h1 className="mt-5 max-w-sm text-4xl font-extrabold leading-tight">
              Regain access without losing momentum.
            </h1>
            <p className="mt-5 max-w-md text-sm leading-7 text-white/78">
              Enter your work email and we will send a secure reset link so you can return to your workspace quickly.
            </p>

            <div className="mt-8 grid gap-4">
              <div className="rounded-3xl border border-white/12 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-white/60">
                  SECURE RESET
                </p>
                <p className="mt-2 text-sm leading-6 text-white/78">
                  Password reset links are time-bound and tied to your account for safer recovery.
                </p>
              </div>
              <div className="rounded-3xl border border-white/12 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-white/60">
                  QUICK HELP
                </p>
                <p className="mt-2 text-sm leading-6 text-white/78">
                  If the mail does not appear in inbox, check spam or contact HR for support.
                </p>
              </div>
            </div>
          </div>

          <div className="p-8 md:p-9 lg:overflow-y-auto lg:p-8">
            <div className="mx-auto max-w-md">
              <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-teal-700/75">
                Forgot Password
              </p>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">
                Reset your password
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Share your email address and we will send a reset link to continue securely.
              </p>

              <div className="mt-6 rounded-3xl border border-[rgba(15,118,110,0.12)] bg-[rgba(240,253,250,0.8)] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-teal-700/80">
                  Email Check
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Use the same work email linked to your EMS account.
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5 lg:mt-5">
                <Controller
                  control={control}
                  name="email"
                  rules={{ required: "Email is required" }}
                  render={({ field }) => (
                    <InputField
                      type="email"
                      label="Work Email"
                      placeholder="Enter your registered email"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      error={errors.email?.message}
                    />
                  )}
                />

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full"
                  size="lg"
                >
                  {loading ? "Sending reset link..." : "Send Reset Link"}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  to="/"
                  className="text-sm font-semibold text-teal-700 underline underline-offset-4 hover:text-teal-800"
                >
                  Back to Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={dialogOpen}
        title={isSuccess ? "Success" : "Error"}
        message={dialogMessage}
        mode={isSuccess ? "Success" : "Confirm"}
        onConfirm={close}
        onCancel={close}
      />
    </>
  );
}