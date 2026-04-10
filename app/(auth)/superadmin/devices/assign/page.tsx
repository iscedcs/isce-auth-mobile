"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Camera,
  CameraOff,
  Check,
  ChevronDown,
  Keyboard,
  Loader2,
  QrCode,
  Search,
  User as UserIcon,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { csrfFetch } from "@/lib/csrf-client";

// ── Types ────────────────────────────────────────────────────────

interface UserRecord {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  displayPicture?: string;
  username?: string;
}

interface DeviceRecord {
  id: string;
  productId: string;
  type: string;
  isPrimary: boolean;
  assignedAt?: string;
  createdAt?: string;
  userId: string | null;
  user?: UserRecord | null;
}

// ── Constants ────────────────────────────────────────────────────

const DEVICE_TYPE_LABELS: Record<string, string> = {
  "6214bdef7dbcb": "Card",
  "6214bdef6dbcb": "Wristband",
  "6214bdef5dbcb": "Sticker",
  CARD: "Card",
  WRISTBAND: "Wristband",
  STICKER: "Sticker",
};

const DEVICE_TYPE_COLORS: Record<string, string> = {
  Card: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  Wristband: "bg-purple-500/15 text-purple-300 border-purple-500/30",
  Sticker: "bg-amber-500/15 text-amber-300 border-amber-500/30",
};

const DEVICE_TYPE_ICONS: Record<string, string> = {
  Card: "💳",
  Wristband: "⌚",
  Sticker: "🏷️",
};

// ── QR Scanner Component ─────────────────────────────────────────

function QrScanner({
  onScan,
  onClose,
}: {
  onScan: (productId: string, deviceType?: string) => void;
  onClose: () => void;
}) {
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    let scanner: any = null;

    const startScanner = async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (!scannerRef.current) return;

        scanner = new Html5Qrcode("qr-reader");
        html5QrCodeRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1,
          },
          (decodedText: string) => {
            // Parse the QR URL: https://isce.app/?id=PRODUCT_ID&type=TYPE
            try {
              const url = new URL(decodedText);
              const productId = url.searchParams.get("id");
              const deviceType = url.searchParams.get("type") || undefined;
              if (productId) {
                onScan(productId, deviceType);
                scanner?.stop().catch(() => {});
              }
            } catch {
              // Maybe it's just a raw product ID
              if (decodedText.trim()) {
                onScan(decodedText.trim());
                scanner?.stop().catch(() => {});
              }
            }
          },
          () => {}, // ignore scan failures
        );
        setInitializing(false);
      } catch (err: any) {
        setInitializing(false);
        if (err?.name === "NotAllowedError") {
          setError("Camera access denied. Please allow camera permissions.");
        } else if (err?.name === "NotFoundError") {
          setError("No camera found on this device.");
        } else {
          setError("Failed to start camera. Try manual entry instead.");
        }
      }
    };

    startScanner();

    return () => {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => {});
        html5QrCodeRef.current = null;
      }
    };
  }, [onScan]);

  return (
    <div className="relative rounded-2xl overflow-hidden bg-black/50 border border-white/10">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white/5">
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-medium text-white/80">QR Scanner</span>
        </div>
        <button
          title="close menu"
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4 text-white/60" />
        </button>
      </div>

      {/* Scanner viewport */}
      <div className="relative aspect-square max-h-[320px] w-full">
        <div id="qr-reader" ref={scannerRef} className="w-full h-full" />

        {initializing && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80">
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin mb-3" />
            <p className="text-sm text-white/60">Starting camera...</p>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 px-6">
            <CameraOff className="w-10 h-10 text-red-400 mb-3" />
            <p className="text-sm text-red-300 text-center">{error}</p>
          </div>
        )}
      </div>

      {/* Helper text */}
      <div className="px-4 py-3 bg-white/5 border-t border-white/5">
        <p className="text-xs text-white/40 text-center">
          Point camera at the QR code on the device
        </p>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────

export default function AssignDevicePage() {
  // ── Step state ─────────────────────────
  const [step, setStep] = useState<"scan" | "user" | "confirm" | "done">(
    "scan",
  );

  // ── Device lookup state ────────────────
  const [inputMode, setInputMode] = useState<"qr" | "manual">("qr");
  const [manualProductId, setManualProductId] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [device, setDevice] = useState<DeviceRecord | null>(null);
  const [scannedType, setScannedType] = useState<string | null>(null);

  // ── User search state ──────────────────
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userSearchResults, setUserSearchResults] = useState<UserRecord[]>([]);
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ── Assign state ───────────────────────
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [assignResult, setAssignResult] = useState<any>(null);

  // ── Click outside handler for dropdown ─
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Device lookup ──────────────────────
  const lookupDevice = useCallback(
    async (productId: string, deviceType?: string) => {
      setLookupLoading(true);
      setLookupError(null);
      setDevice(null);

      if (deviceType) setScannedType(deviceType);

      try {
        const res = await fetch(
          `/api/admin/devices/lookup?productId=${encodeURIComponent(productId)}`,
        );
        const data = await res.json();

        if (!res.ok || !data.success) {
          if (res.status === 404) {
            setLookupError(
              "Device not found. Check the product ID and try again.",
            );
          } else {
            setLookupError(data.message || "Failed to look up device");
          }
          return;
        }

        const d = data.data as DeviceRecord;

        if (d.userId) {
          setLookupError(
            `This device is already assigned to ${d.user?.email || "a user"}. Use the reassign feature instead.`,
          );
          setDevice(d);
          return;
        }

        setDevice(d);
        setStep("user");
      } catch {
        setLookupError("Network error. Please try again.");
      } finally {
        setLookupLoading(false);
      }
    },
    [],
  );

  const handleManualLookup = () => {
    const trimmed = manualProductId.trim();
    if (!trimmed) return;

    // Try to parse as URL first (in case user pastes a full URL)
    try {
      const url = new URL(trimmed);
      const id = url.searchParams.get("id");
      const type = url.searchParams.get("type") || undefined;
      if (id) {
        lookupDevice(id, type);
        return;
      }
    } catch {
      // Not a URL, use as raw product ID
    }

    lookupDevice(trimmed);
  };

  // ── User search (debounced) ────────────
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (!userSearchQuery.trim() || userSearchQuery.trim().length < 2) {
      setUserSearchResults([]);
      setShowDropdown(false);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setUserSearchLoading(true);
      try {
        const isEmail = userSearchQuery.includes("@");
        const params = new URLSearchParams();
        if (isEmail) {
          params.set("email", userSearchQuery.trim());
        } else {
          params.set("fullname", userSearchQuery.trim());
        }

        const res = await fetch(`/api/admin/users/search?${params}`);
        const data = await res.json();

        if (data.success && Array.isArray(data.data)) {
          setUserSearchResults(data.data);
          setShowDropdown(data.data.length > 0);
        } else {
          setUserSearchResults([]);
          setShowDropdown(false);
        }
      } catch {
        setUserSearchResults([]);
      } finally {
        setUserSearchLoading(false);
      }
    }, 400);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [userSearchQuery]);

  // ── Assign device ──────────────────────
  const handleAssign = async () => {
    if (!device || !selectedUser) return;

    setAssigning(true);
    setAssignError(null);

    try {
      const res = await csrfFetch("/api/admin/devices/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: device.productId,
          userId: selectedUser.id,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setAssignError(
          data.message || "Failed to assign device. Please try again.",
        );
        return;
      }

      setAssignResult(data);
      setStep("done");
    } catch {
      setAssignError("Network error. Please try again.");
    } finally {
      setAssigning(false);
    }
  };

  // ── Reset all ──────────────────────────
  const resetAll = () => {
    setStep("scan");
    setInputMode("qr");
    setManualProductId("");
    setLookupLoading(false);
    setLookupError(null);
    setDevice(null);
    setScannedType(null);
    setUserSearchQuery("");
    setUserSearchResults([]);
    setSelectedUser(null);
    setShowDropdown(false);
    setAssignError(null);
    setAssignResult(null);
  };

  // ── Helpers ────────────────────────────
  const getTypeLabel = (type: string) => DEVICE_TYPE_LABELS[type] || type;
  const getTypeColors = (type: string) => {
    const label = getTypeLabel(type);
    return (
      DEVICE_TYPE_COLORS[label] ||
      "bg-gray-500/15 text-gray-300 border-gray-500/30"
    );
  };
  const getTypeIcon = (type: string) => {
    const label = getTypeLabel(type);
    return DEVICE_TYPE_ICONS[label] || "📱";
  };

  // ── Stepper indicator ──────────────────
  const steps = [
    { key: "scan", label: "Find Device" },
    { key: "user", label: "Select User" },
    { key: "confirm", label: "Confirm" },
  ];
  const currentStepIndex =
    step === "done" ? 3 : steps.findIndex((s) => s.key === step);

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/superadmin/devices"
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-white/60" />
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">
            Assign Device
          </h1>
          <p className="text-sm text-white/50 mt-0.5">
            Assign an unassigned device to a user
          </p>
        </div>
      </div>

      {/* Stepper */}
      <div className="mb-8">
        <div className="flex items-center gap-2 sm:gap-3">
          {steps.map((s, i) => (
            <div key={s.key} className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                    i < currentStepIndex
                      ? "bg-green-500 text-white"
                      : i === currentStepIndex
                        ? "bg-blue-500 text-white ring-2 ring-blue-500/30"
                        : "bg-white/10 text-white/40"
                  }`}
                >
                  {i < currentStepIndex ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    i + 1
                  )}
                </div>
                <span
                  className={`text-xs sm:text-sm font-medium hidden sm:inline ${
                    i <= currentStepIndex ? "text-white/80" : "text-white/30"
                  }`}
                >
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`w-8 sm:w-12 h-px transition-colors ${
                    i < currentStepIndex ? "bg-green-500/50" : "bg-white/10"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Step 1: Find Device ────────────────────────── */}
      {step === "scan" && (
        <div className="max-w-lg mx-auto space-y-5">
          {/* Mode toggle */}
          <div className="flex rounded-xl overflow-hidden border border-white/10 bg-white/5">
            <button
              onClick={() => setInputMode("qr")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-all ${
                inputMode === "qr"
                  ? "bg-blue-500/20 text-blue-300 border-b-2 border-blue-400"
                  : "text-white/50 hover:text-white/70 hover:bg-white/5"
              }`}
            >
              <QrCode className="w-4 h-4" />
              Scan QR Code
            </button>
            <button
              onClick={() => setInputMode("manual")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-all ${
                inputMode === "manual"
                  ? "bg-blue-500/20 text-blue-300 border-b-2 border-blue-400"
                  : "text-white/50 hover:text-white/70 hover:bg-white/5"
              }`}
            >
              <Keyboard className="w-4 h-4" />
              Type Product ID
            </button>
          </div>

          {/* QR Scanner mode */}
          {inputMode === "qr" && (
            <QrScanner
              onScan={(productId, deviceType) => {
                lookupDevice(productId, deviceType);
              }}
              onClose={() => setInputMode("manual")}
            />
          )}

          {/* Manual entry mode */}
          {inputMode === "manual" && (
            <div className="space-y-3">
              <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Product ID or Device URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={manualProductId}
                    onChange={(e) => setManualProductId(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleManualLookup();
                    }}
                    placeholder="e.g. f1a45ed68c9e73a954ff87bbf9b8d0de"
                    className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-all"
                  />
                  <button
                    onClick={handleManualLookup}
                    disabled={!manualProductId.trim() || lookupLoading}
                    className="px-5 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    {lookupLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                    Look up
                  </button>
                </div>
                <p className="text-xs text-white/30 mt-2">
                  Enter the product ID from the device or paste the full URL
                  from the QR code
                </p>
              </div>
            </div>
          )}

          {/* Lookup loading state */}
          {lookupLoading && inputMode === "qr" && (
            <div className="flex items-center justify-center gap-3 py-6 rounded-2xl bg-white/5 border border-white/10">
              <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
              <span className="text-sm text-white/60">
                Looking up device...
              </span>
            </div>
          )}

          {/* Lookup error */}
          {lookupError && (
            <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-4">
              <p className="text-sm text-red-300">{lookupError}</p>
              {device?.userId && (
                <Link
                  href="/superadmin/devices"
                  className="inline-flex items-center gap-1.5 mt-2 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Go to device management →
                </Link>
              )}
              <button
                onClick={() => {
                  setLookupError(null);
                  setDevice(null);
                }}
                className="block mt-2 text-xs text-white/50 hover:text-white/70 transition-colors"
              >
                Try again
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Step 2: Select User ────────────────────────── */}
      {step === "user" && device && (
        <div className="max-w-lg mx-auto space-y-5">
          {/* Device info card */}
          <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="text-2xl">
                {getTypeIcon(scannedType || device.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-white truncate">
                    {device.productId}
                  </p>
                  <Badge
                    variant="outline"
                    className={`text-[10px] px-1.5 ${getTypeColors(scannedType || device.type)}`}
                  >
                    {getTypeLabel(scannedType || device.type)}
                  </Badge>
                </div>
                <p className="text-xs text-green-400 mt-0.5">
                  ✓ Unassigned — ready to assign
                </p>
              </div>
            </div>
          </div>

          {/* User search */}
          <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
            <label className="block text-sm font-medium text-white/70 mb-2">
              Search for user to assign
            </label>
            <div className="relative" ref={dropdownRef}>
              {selectedUser ? (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-500/10 border border-blue-500/30">
                  {selectedUser.displayPicture ? (
                    <Image
                      src={selectedUser.displayPicture}
                      alt=""
                      width={36}
                      height={36}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
                      <UserIcon className="w-4 h-4 text-white/40" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {selectedUser.firstName} {selectedUser.lastName}
                    </p>
                    <p className="text-xs text-white/50 truncate">
                      {selectedUser.email}
                    </p>
                  </div>
                  <button
                    title="close selected user"
                    onClick={() => {
                      setSelectedUser(null);
                      setUserSearchQuery("");
                      setUserSearchResults([]);
                    }}
                    className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <X className="w-4 h-4 text-white/50" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input
                      type="text"
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      placeholder="Search by name or email..."
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-all"
                    />
                    {userSearchLoading && (
                      <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400 animate-spin" />
                    )}
                  </div>

                  {/* Search dropdown */}
                  {showDropdown && userSearchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 max-h-60 overflow-y-auto rounded-xl bg-[#1a1a2e] border border-white/10 shadow-2xl z-20">
                      {userSearchResults.map((user) => (
                        <button
                          key={user.id}
                          onClick={() => {
                            setSelectedUser(user);
                            setShowDropdown(false);
                            setUserSearchQuery("");
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left"
                        >
                          {user.displayPicture ? (
                            <Image
                              src={user.displayPicture}
                              alt=""
                              width={32}
                              height={32}
                              className="rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                              <UserIcon className="w-3.5 h-3.5 text-white/40" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white truncate">
                              {user.firstName} {user.lastName}
                            </p>
                            <p className="text-xs text-white/40 truncate">
                              {user.email}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {showDropdown &&
                    userSearchResults.length === 0 &&
                    !userSearchLoading &&
                    userSearchQuery.trim().length >= 2 && (
                      <div className="absolute top-full left-0 right-0 mt-1 rounded-xl bg-[#1a1a2e] border border-white/10 shadow-2xl z-20 p-4">
                        <p className="text-sm text-white/40 text-center">
                          No users found
                        </p>
                      </div>
                    )}
                </>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => {
                setStep("scan");
                setDevice(null);
                setLookupError(null);
                setScannedType(null);
              }}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 text-sm font-medium transition-colors"
            >
              ← Back
            </button>
            <button
              onClick={() => setStep("confirm")}
              disabled={!selectedUser}
              className="flex-1 px-4 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Confirm ────────────────────────────── */}
      {step === "confirm" && device && selectedUser && (
        <div className="max-w-lg mx-auto space-y-5">
          <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
            <div className="px-5 py-4 border-b border-white/5">
              <h3 className="text-base font-semibold text-white">
                Confirm Assignment
              </h3>
              <p className="text-xs text-white/40 mt-0.5">
                Review the details below before assigning
              </p>
            </div>

            {/* Device */}
            <div className="px-5 py-4 border-b border-white/5">
              <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-2">
                Device
              </p>
              <div className="flex items-center gap-3">
                <div className="text-2xl">
                  {getTypeIcon(scannedType || device.type)}
                </div>
                <div>
                  <p className="text-sm font-medium text-white font-mono">
                    {device.productId}
                  </p>
                  <Badge
                    variant="outline"
                    className={`text-[10px] px-1.5 mt-1 ${getTypeColors(scannedType || device.type)}`}
                  >
                    {getTypeLabel(scannedType || device.type)}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Arrow */}
            <div className="flex items-center justify-center py-2 bg-white/[0.02]">
              <div className="w-8 h-8 rounded-full bg-green-500/15 flex items-center justify-center">
                <ChevronDown className="w-4 h-4 text-green-400" />
              </div>
            </div>

            {/* User */}
            <div className="px-5 py-4">
              <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-2">
                Assign To
              </p>
              <div className="flex items-center gap-3">
                {selectedUser.displayPicture ? (
                  <Image
                    src={selectedUser.displayPicture}
                    alt=""
                    width={40}
                    height={40}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                    <UserIcon className="w-5 h-5 text-white/40" />
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-white">
                    {selectedUser.firstName} {selectedUser.lastName}
                  </p>
                  <p className="text-xs text-white/40">{selectedUser.email}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Error */}
          {assignError && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3">
              <p className="text-sm text-red-300">{assignError}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => setStep("user")}
              disabled={assigning}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 text-sm font-medium transition-colors disabled:opacity-50"
            >
              ← Back
            </button>
            <button
              onClick={handleAssign}
              disabled={assigning}
              className="flex-1 px-4 py-2.5 rounded-xl bg-green-500 hover:bg-green-600 disabled:opacity-60 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
            >
              {assigning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Assigning...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Assign Device
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── Step 4: Success ────────────────────────────── */}
      {step === "done" && (
        <div className="max-w-lg mx-auto">
          <div className="rounded-2xl bg-green-500/10 border border-green-500/20 p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
              <Check className="w-7 h-7 text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">
              Device Assigned!
            </h3>
            <p className="text-sm text-white/50 mb-5">
              {assignResult?.message ||
                "The device has been assigned successfully."}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={resetAll}
                className="px-5 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition-colors"
              >
                Assign Another Device
              </button>
              <Link
                href="/superadmin/devices"
                className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 text-sm font-medium transition-colors text-center"
              >
                Back to Devices
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
