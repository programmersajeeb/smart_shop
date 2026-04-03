import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  UserRound,
  ShieldCheck,
  RefreshCw,
  Sparkles,
} from "lucide-react";

import { useAuth } from "../../../shared/hooks/useAuth";
import { auth } from "../../../services/firebaseClient";
import { updateProfile } from "firebase/auth";

import { exchangeFirebaseToken } from "../../../services/authApi";
import { setAccessToken } from "../../../core/config/tokenStore";

import ProfileSettingsSkeleton from "../../../shared/components/ui/skeletons/ProfileSettingsSkeleton";

function cx(...a) {
  return a.filter(Boolean).join(" ");
}

function getErrorMessage(error) {
  const serverMessage =
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message;

  return serverMessage ? String(serverMessage) : "Something went wrong.";
}

function isValidHttpsUrl(value) {
  const v = String(value || "").trim();
  if (!v) return true;
  try {
    const u = new URL(v);
    return u.protocol === "https:";
  } catch {
    return false;
  }
}

function AvatarPreview({ photoURL, displayName }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setLoaded(false);
    setFailed(false);
  }, [photoURL]);

  const fallback =
    String(displayName || "U")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((x) => x[0]?.toUpperCase())
      .join("") || "U";

  return (
    <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-[26px] border border-gray-200 bg-gray-100">
      {!photoURL || failed ? (
        <span className="text-lg font-bold text-gray-700">{fallback}</span>
      ) : (
        <>
          {!loaded ? <div className="h-full w-full animate-pulse bg-gray-200" /> : null}

          <img
            src={photoURL}
            alt="Avatar"
            className={cx(
              "h-full w-full object-cover transition-opacity duration-300",
              loaded ? "opacity-100" : "opacity-0"
            )}
            referrerPolicy="no-referrer"
            loading="lazy"
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
          />
        </>
      )}
    </div>
  );
}

export default function ProfileSettingsPage() {
  const nav = useNavigate();
  const { user, setUser, logout } = useAuth();

  if (!user) {
    return <ProfileSettingsSkeleton />;
  }

  const initialDisplayName = useMemo(
    () => user?.displayName || user?.name || user?.fullName || "",
    [user]
  );

  const initialPhotoURL = useMemo(() => user?.photoURL || "", [user]);

  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [photoURL, setPhotoURL] = useState(initialPhotoURL);

  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setDisplayName(initialDisplayName);
    setPhotoURL(initialPhotoURL);
  }, [initialDisplayName, initialPhotoURL]);

  const trimmedName = String(displayName || "").trim();
  const trimmedPhoto = String(photoURL || "").trim();
  const isPhotoUrlValid = isValidHttpsUrl(trimmedPhoto);

  const isDirty =
    trimmedName !== String(initialDisplayName || "").trim() ||
    trimmedPhoto !== String(initialPhotoURL || "").trim();

  const saveMutation = useMutation({
    mutationFn: async ({ nextName, nextPhoto }) => {
      const cu = auth.currentUser;
      if (!cu) throw new Error("Firebase user not found. Please sign in again.");

      await updateProfile(cu, {
        displayName: nextName || null,
        photoURL: nextPhoto || null,
      });

      const idToken = await cu.getIdToken(true);
      const data = await exchangeFirebaseToken(idToken);

      if (data?.accessToken) setAccessToken(data.accessToken);
      if (data?.user) setUser(data.user);

      return data;
    },
    onSuccess: () => {
      setError("");
      setSuccess("Your profile has been updated successfully.");
    },
    onError: (e) => {
      setSuccess("");
      setError(getErrorMessage(e));
    },
  });

  async function onLogout() {
    await logout();
    nav("/", { replace: true });
  }

  function resetChanges() {
    setDisplayName(initialDisplayName);
    setPhotoURL(initialPhotoURL);
    setError("");
    setSuccess("");
  }

  const canSave = isDirty && isPhotoUrlValid && !saveMutation.isPending;

  return (
    <div className="space-y-5">
      <div className="rounded-[30px] border border-gray-200 bg-white p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
              My account
            </div>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-gray-900 md:text-[30px]">
              Profile & security
            </h2>
            <div className="mt-2 text-sm text-gray-600">
              Keep your name, avatar, and account identity up to date.
            </div>
          </div>

          <Link
            to="/account"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            <ArrowLeft size={16} />
            Back to overview
          </Link>
        </div>
      </div>

      {success ? (
        <div
          className="flex gap-3 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-800"
          aria-live="polite"
        >
          <CheckCircle2 className="mt-0.5" size={18} />
          <div>
            <div className="font-semibold">Updated</div>
            <div className="mt-1">{success}</div>
          </div>
        </div>
      ) : null}

      {error ? (
        <div
          className="flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          aria-live="polite"
        >
          <AlertTriangle className="mt-0.5" size={18} />
          <div>
            <div className="font-semibold">Update failed</div>
            <div className="mt-1">{error}</div>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <div className="rounded-[30px] border border-gray-200 bg-white p-5 shadow-sm md:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <AvatarPreview photoURL={trimmedPhoto} displayName={trimmedName || user?.email} />

              <div className="min-w-0">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                  Profile details
                  <Sparkles size={14} className="opacity-70" />
                </div>
                <div className="mt-1 text-sm text-gray-500">
                  Update the information shown across your account area.
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-5">
              <div>
                <label className="text-sm font-medium text-gray-800">Display name</label>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 outline-none transition focus:ring-2 focus:ring-black focus:ring-offset-2"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-800">Photo URL</label>
                <input
                  value={photoURL}
                  onChange={(e) => setPhotoURL(e.target.value)}
                  className={cx(
                    "mt-2 w-full rounded-2xl border bg-white px-4 py-3 outline-none transition focus:ring-2 focus:ring-black focus:ring-offset-2",
                    !isPhotoUrlValid ? "border-red-300" : "border-gray-200"
                  )}
                  placeholder="https://..."
                />

                {!isPhotoUrlValid ? (
                  <div className="mt-2 text-xs text-red-600">
                    Photo URL must be a valid https:// URL.
                  </div>
                ) : (
                  <div className="mt-2 text-xs text-gray-500">
                    Leave this empty if you prefer the default avatar.
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-800">Email</label>
                <input
                  value={user?.email || ""}
                  disabled
                  className="mt-2 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-600 outline-none"
                />
              </div>

              <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:flex-wrap">
                <button
                  type="button"
                  className={cx(
                    "inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold transition",
                    canSave
                      ? "bg-black text-white hover:bg-gray-900"
                      : "cursor-not-allowed bg-gray-200 text-gray-600"
                  )}
                  disabled={!canSave}
                  onClick={() => {
                    setError("");
                    setSuccess("");
                    saveMutation.mutate({
                      nextName: trimmedName,
                      nextPhoto: trimmedPhoto,
                    });
                  }}
                >
                  {saveMutation.isPending ? (
                    <>
                      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <UserRound size={18} />
                      Save changes
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={resetChanges}
                  disabled={!isDirty || saveMutation.isPending}
                  className={cx(
                    "inline-flex items-center justify-center gap-2 rounded-2xl border px-5 py-3 text-sm font-semibold transition",
                    !isDirty || saveMutation.isPending
                      ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
                      : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                  )}
                >
                  <RefreshCw size={18} />
                  Reset
                </button>
              </div>

              {!isDirty ? (
                <div className="text-xs text-gray-500">No changes to save right now.</div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="space-y-5 xl:col-span-5">
          <div className="rounded-[30px] border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <ShieldCheck size={18} />
              Security
            </div>
            <div className="mt-3 text-sm leading-6 text-gray-600">
              Your login session stays protected through the current authenticated state.
              Logging out ends the active session on this device.
            </div>

            <button
              type="button"
              onClick={onLogout}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-100"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>

          <div className="rounded-[30px] border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <Camera size={18} />
              Helpful tips
            </div>

            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-gray-600">
              <li>Use a clear display name so your account feels easy to recognize.</li>
              <li>Make sure your avatar URL starts with https:// for a secure image source.</li>
              <li>Profile updates will sync with refreshed account data after saving.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}