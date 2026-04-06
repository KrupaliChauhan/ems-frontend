const API_URL = import.meta.env.VITE_API_URL;

type ApiErrorItem = {
  field?: unknown;
  message?: unknown;
};

function toReadableFieldName(field: string) {
  return field
    .replace(/\[(\d+)\]/g, " $1 ")
    .split(".")
    .filter(Boolean)
    .map((part) => part.replace(/([a-z0-9])([A-Z])/g, "$1 $2"))
    .join(" ")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (char) => char.toUpperCase());
}

function extractErrorMessage(data: unknown) {
  if (typeof data !== "object" || data === null) {
    return "Something went wrong";
  }

  const payload = data as { message?: unknown; errors?: unknown };
  const errors = Array.isArray(payload.errors) ? payload.errors : [];
  const formattedErrors = errors
    .map((item) => {
      if (typeof item === "string") {
        return item.trim();
      }

      if (typeof item !== "object" || item === null) {
        return "";
      }

      const { field, message } = item as ApiErrorItem;
      const safeMessage = typeof message === "string" ? message.trim() : "";
      const safeField = typeof field === "string" ? toReadableFieldName(field) : "";

      if (!safeMessage) return safeField;
      if (!safeField) return safeMessage;

      const normalizedMessage = safeMessage.toLowerCase();
      if (normalizedMessage.includes(safeField.toLowerCase())) {
        return safeMessage;
      }

      return `${safeField}: ${safeMessage}`;
    })
    .filter(Boolean);

  if (formattedErrors.length > 0) {
    return formattedErrors.join(". ");
  }

  if (typeof payload.message === "string" && payload.message.trim()) {
    return payload.message;
  }

  return "Something went wrong";
}

export async function apiRequest<T>(
  endpoint: string,
  method: string = "GET",
  body?: unknown
): Promise<T> {
  const token = localStorage.getItem("token");
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

  let res: Response;
  try {
    res = await fetch(`${API_URL}${endpoint}`, {
      method,
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body
        ? {
            body: isFormData ? (body as FormData) : JSON.stringify(body),
          }
        : {}),
    });
  } catch {
    throw new Error("Unable to connect to the server");
  }

  const raw = await res.text();
  let data: unknown = null;

  if (raw) {
    try {
      data = JSON.parse(raw);
    } catch {
      data = raw;
    }
  }

  if (!res.ok) {
    const msg = extractErrorMessage(data);

    if (res.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/";
    }

    throw new Error(msg);
  }

  if (typeof data === "object" && data !== null && "data" in data) {
    return (data as { data: T }).data;
  }

  return data as T;
}

export type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data: T;
};
