import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, Camera, CheckCircle2, AlertTriangle, LogOut } from "lucide-react";

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
  if (!v) return true; // Empty is allowed
  try {
    const u = new URL(v);
    return u.protocol === "https:";
  } catch {
    return false;
  }
}

function AvatarPreview({ photoURL }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setLoaded(false);
    setFailed(false);
  }, [photoURL]);

  return (
    <div className="w-12 h-12 rounded-2xl bg-gray-100 border overflow-hidden flex items-center justify-center">
      {!photoURL ? (
        <Camera size={18} className="text-gray-500" />
      ) : failed ? (
        <Camera size={18} className="text-gray-500" />
      ) : (
        <>
          {!loaded ? <div className="w-full h-full skeleton" /> : null}

          <img
            src={photoURL}
            alt="Avatar"
            className={cx(
              "w-full h-full object-cover transition-opacity duration-300",
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

  // If the auth state is not ready, show a full skeleton page (enterprise smoothness).
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

      // Force token refresh so decoded claims update
      const idToken = await cu.getIdToken(true);

      // Sync to backend + receive new access token & refresh cookie
      const data = await exchangeFirebaseToken(idToken);

      if (data?.accessToken) setAccessToken(data.accessToken);
      if (data?.user) setUser(data.user);

      return data;
    },
    onSuccess: () => {
      setError("");
      setSuccess("Profile updated successfully.");
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

  const canSave = isDirty && isPhotoUrlValid && !saveMutation.isPending;

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm text-gray-500">My account</div>
            <h2 className="text-2xl font-bold text-gray-900 mt-1">
              Profile & Security
            </h2>
          </div>

          <Link
            to="/account"
            className="btn btn-outline rounded-2xl bg-white hover:bg-gray-50 border-gray-200"
          >
            <ArrowLeft size={16} /> Back
          </Link>
        </div>
      </div>

      {success ? (
        <div
          className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-800 flex gap-3"
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
          className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 flex gap-3"
          aria-live="polite"
        >
          <AlertTriangle className="mt-0.5" size={18} />
          <div>
            <div className="font-semibold">Update failed</div>
            <div className="mt-1">{error}</div>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Profile card */}
        <div className="lg:col-span-7">
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <AvatarPreview photoURL={trimmedPhoto} />

              <div>
                <div className="font-semibold text-gray-900">Profile</div>
                <div className="text-sm text-gray-500">Update your name & photo</div>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-800">Display name</label>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="mt-2 input input-bordered w-full rounded-2xl bg-white"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-800">Photo URL</label>
                <input
                  value={photoURL}
                  onChange={(e) => setPhotoURL(e.target.value)}
                  className={cx(
                    "mt-2 input input-bordered w-full rounded-2xl bg-white",
                    !isPhotoUrlValid ? "input-error" : ""
                  )}
                  placeholder="https://..."
                />

                {!isPhotoUrlValid ? (
                  <div className="text-xs text-red-600 mt-2">
                    Photo URL must be a valid https:// URL.
                  </div>
                ) : (
                  <div className="text-xs text-gray-500 mt-2">
                    You can leave it empty—then the default avatar will be shown.
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-800">Email</label>
                <input
                  value={user?.email || ""}
                  disabled
                  className="mt-2 input input-bordered w-full rounded-2xl bg-gray-50"
                />
              </div>

              <button
                type="button"
                className={cx(
                  "btn w-full rounded-2xl border-0 text-white",
                  canSave ? "bg-black hover:bg-gray-900" : "bg-gray-700"
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
                  <span className="loading loading-spinner loading-sm"></span>
                ) : null}
                Save changes
              </button>

              {!isDirty ? (
                <div className="text-xs text-gray-500 text-center">
                  No changes to save.
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* Security / actions */}
        <div className="lg:col-span-5 space-y-5">
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="font-semibold text-gray-900">Security</div>
            <div className="text-sm text-gray-600 mt-2">
              Your login is secured by Firebase. When you log out, the access token will be cleared
              and the refresh cookie will be revoked.
            </div>

            <button
              type="button"
              onClick={onLogout}
              className="btn btn-outline w-full mt-5 rounded-2xl bg-white hover:bg-gray-50 border-gray-200 text-red-600"
            >
              <LogOut size={18} /> Logout
            </button>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="font-semibold text-gray-900">Tips</div>
            <ul className="mt-3 text-sm text-gray-600 list-disc pl-5 space-y-1">
              <li>Do not enable “Remember me” on public devices.</li>
              <li>Make sure the photo URL starts with https://</li>
              <li>If anything looks wrong, log out and log in again.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
