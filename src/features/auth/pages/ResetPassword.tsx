import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Controller, useForm } from "react-hook-form";
import { useEffect, useMemo, useState } from "react";
import Button from "../../../components/ui/Button";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import FormRequiredNote from "../../../components/ui/FormRequiredNote";
import { InputField } from "../../../components/ui/InputField";
import { apiRequest } from "../../../services/api";

type FormData = { password: string; confirmPassword: string };

export default function ResetPassword() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const token = useMemo(() => params.get("token") || "", [params]);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: { password: "", confirmPassword: "" },
  });

  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMessage, setDialogMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setIsSuccess(false);
      setDialogMessage(
        "Invalid or missing reset token. Please request a new reset link.",
      );
      setDialogOpen(true);
    }
  }, [token]);

  const onSubmit = async (data: FormData) => {
    if (!token) return;

    if (data.password !== data.confirmPassword) {
      setError("confirmPassword", { message: "Passwords do not match" });
      return;
    }

    setLoading(true);

    try {
      await apiRequest<{ message: string }>(
        "/api/auth/reset-password",
        "POST",
        { token, newPassword: data.password },
      );
      setIsSuccess(true);
      setDialogMessage("Password updated successfully. Please sign in with your new password.");
      setDialogOpen(true);
    } catch (e: unknown) {
      let message = "Reset failed";
      if (e instanceof Error) message = e.message;
      else if (typeof e === "string") message = e;

      setIsSuccess(false);
      setDialogMessage(message);
      setDialogOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const close = () => {
    setDialogOpen(false);
    if (isSuccess) navigate("/", { replace: true });
  };

  return (
    <>
      <div className="relative flex min-h-[100dvh] items-center justify-center overflow-x-hidden overflow-y-auto px-4 py-4 lg:py-3">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(15,118,110,0.16),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(217,119,6,0.12),transparent_24%)]" />

        <div className="float-in relative my-auto grid w-full max-w-5xl overflow-hidden rounded-[34px] border border-[rgba(123,97,63,0.12)] bg-[rgba(255,252,246,0.9)] shadow-[0_30px_70px_rgba(33,29,22,0.12)] backdrop-blur lg:max-h-[calc(100dvh-1.5rem)] lg:grid-cols-[1.05fr_0.95fr]">
          <div className="hidden bg-[linear-gradient(160deg,#0f766e_0%,#115e59_45%,#134e4a_100%)] p-8 text-white lg:block lg:overflow-y-auto">
            <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-white/70">
              Password Reset
            </p>
            <h1 className="mt-5 max-w-sm text-4xl font-extrabold leading-tight">
              Create a fresh password with confidence.
            </h1>
            <p className="mt-5 max-w-md text-sm leading-7 text-white/78">
              Choose a strong new password to secure your account and get back into your workspace.
            </p>

            <div className="mt-8 grid gap-4">
              <div className="rounded-3xl border border-white/12 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-white/60">
                  GOOD PRACTICE
                </p>
                <p className="mt-2 text-sm leading-6 text-white/78">
                  Use a password that is easy for you to remember and hard for others to guess.
                </p>
              </div>
              <div className="rounded-3xl border border-white/12 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-white/60">
                  SAFE ACCESS
                </p>
                <p className="mt-2 text-sm leading-6 text-white/78">
                  Once updated, your old reset link should no longer be reused for security reasons.
                </p>
              </div>
            </div>
          </div>

          <div className="p-8 md:p-9 lg:overflow-y-auto lg:p-8">
            <div className="mx-auto max-w-md">
              <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-teal-700/75">
                Reset Password
              </p>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">
                Set a new password
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Enter and confirm your new password to complete account recovery.
              </p>

              <div className="mt-6 rounded-3xl border border-[rgba(217,119,6,0.14)] bg-[rgba(255,251,235,0.88)] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-700/85">
                  Secure Update
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Make sure both password fields match before submitting.
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5 lg:mt-5">
                <FormRequiredNote />
                <Controller
                  control={control}
                  name="password"
                  rules={{ required: "Password is required" }}
                  render={({ field }) => (
                    <InputField
                      type="password"
                      label="New Password"
                      required
                      placeholder="Enter your new password"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      error={errors.password?.message}
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="confirmPassword"
                  rules={{ required: "Confirm password is required" }}
                  render={({ field }) => (
                    <InputField
                      type="password"
                      label="Confirm Password"
                      required
                      placeholder="Re-enter your new password"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      error={errors.confirmPassword?.message}
                    />
                  )}
                />

                <Button
                  type="submit"
                  disabled={loading || !token}
                  className="w-full"
                  size="lg"
                >
                  {loading ? "Updating password..." : "Update Password"}
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
