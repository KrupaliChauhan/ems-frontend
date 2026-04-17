import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import Button from "../../../components/ui/Button";
import { InputField } from "../../../components/ui/InputField";
import FormRequiredNote from "../../../components/ui/FormRequiredNote";
import Modal from "../../../components/ui/Modal";
import { apiRequest } from "../../../services/api";
import { saveSession, type SessionUser, type UserRole } from "../services/auth";

type LoginFormData = {
  email: string;
  password: string;
};

type LoginResponse = {
  token: string;
  user: SessionUser & { role: UserRole };
};

const Login = () => {
  const navigate = useNavigate();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    defaultValues: { email: "", password: "" },
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMessage, setDialogMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    try {
      const res = await apiRequest<LoginResponse>("/api/auth/login", "POST", {
        email: data.email,
        password: data.password,
      });

      saveSession({
        token: res.token,
        user: {
          id: res.user.id,
          name: res.user.name,
          email: res.user.email,
          role: res.user.role,
          joiningDate: res.user.joiningDate ?? null,
          teamLeaderId: res.user.teamLeaderId ?? null,
        },
      });
      navigate("/dashboard", { replace: true });
    } catch (e: unknown) {
      let message = "Login failed";
      if (e instanceof Error) message = e.message;
      else if (typeof e === "string") message = e;

      setDialogMessage(message);
      setDialogOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
  };

  return (
    <>
      <div className="relative flex min-h-[100dvh] items-center justify-center overflow-x-hidden overflow-y-auto px-4 py-4 lg:py-3">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(15,118,110,0.16),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(217,119,6,0.12),transparent_24%)]" />

        <div className="float-in relative my-auto grid w-full max-w-5xl overflow-hidden rounded-[34px] border border-[rgba(123,97,63,0.12)] bg-[rgba(255,252,246,0.9)] shadow-[0_30px_70px_rgba(33,29,22,0.12)] backdrop-blur lg:max-h-[calc(100dvh-1.5rem)] lg:grid-cols-[1.1fr_0.9fr]">
          <div className="hidden bg-[linear-gradient(160deg,#0f766e_0%,#115e59_45%,#134e4a_100%)] p-8 text-white lg:block lg:overflow-y-auto">
            <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-white/70">
              Employee Management
            </p>
            <h1 className="mt-5 max-w-sm text-4xl font-extrabold leading-tight">
              A calmer, cleaner workspace for daily operations.
            </h1>
            <p className="mt-5 max-w-md text-sm leading-7 text-white/78">
              Manage people, projects, attendance, assets, and leave workflows
              from a single professional dashboard built for real office use.
            </p>

            <div className="mt-8 grid gap-4">
              <div className="rounded-3xl border border-white/12 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-white/60">
                  WORKSPACE CAPABILITIES
                </p>
                <p className="mt-2 text-sm leading-6 text-white/78">
                  Manage employees and roles, Track daily attendance records,
                  Organize projects and teams
                </p>
              </div>
              <div className="rounded-3xl border border-white/12 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-white/60">
                  Built For Teams
                </p>
                <p className="mt-2 text-sm leading-6 text-white/78">
                  Clear workflows, role-based access, and fast admin operations
                  without clutter.
                </p>
              </div>
            </div>
          </div>

          <div className="p-8 md:p-9 lg:overflow-y-auto lg:p-8">
            <div className="mx-auto max-w-md">
              <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-teal-700/75">
                Welcome Back
              </p>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">
                Sign in to EMS
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Continue to your workspace and resume daily operations.
              </p>

              <form
                onSubmit={handleSubmit(onSubmit)}
                className="mt-6 space-y-5 lg:mt-5"
              >
                <FormRequiredNote />
                <Controller
                  control={control}
                  name="email"
                  rules={{ required: "Email is required" }}
                  render={({ field }) => (
                    <InputField
                      type="email"
                      label="Email"
                      required
                      placeholder="Enter your email"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      error={errors.email?.message}
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="password"
                  rules={{ required: "Password is required" }}
                  render={({ field }) => (
                    <InputField
                      type="password"
                      label="Password"
                      required
                      placeholder="Enter your password"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      error={errors.password?.message}
                    />
                  )}
                />

                <div className="flex items-center justify-end">
                  <Link
                    to="/forgot-password"
                    className="text-sm font-semibold text-teal-700 underline underline-offset-4 hover:text-teal-800"
                  >
                    Forgot password?
                  </Link>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full"
                  size="lg"
                >
                  {loading ? "Logging in..." : "Login"}
                </Button>
              </form>

              <p className="mt-5 text-center text-xs text-slate-500">
                Contact HR for account credentials.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Modal
        open={dialogOpen}
        title="Login Failed"
        onClose={handleDialogClose}
        size="sm"
      >
        <p className="text-sm leading-6 text-slate-700">{dialogMessage}</p>
      </Modal>
    </>
  );
};

export default Login;
