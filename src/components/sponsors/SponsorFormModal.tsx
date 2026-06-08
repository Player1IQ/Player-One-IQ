"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X, Loader2 } from "lucide-react";
import {
  type Sponsor,
  type SponsorInput,
  type SponsorStatus,
  type Industry,
  industries,
  sponsorStatuses,
} from "@/lib/sponsors";
import { createSponsor, updateSponsor } from "@/app/sponsors/actions";

interface SponsorFormModalProps {
  open: boolean;
  onClose: () => void;
  sponsor?: Sponsor | null;
}

const emptyContact = () => ({
  name: "",
  title: "",
  email: "",
  phone: "",
});

function sponsorToInput(sponsor: Sponsor): SponsorInput {
  return {
    companyName: sponsor.companyName,
    industry: sponsor.industry,
    status: sponsor.status,
    website: sponsor.website,
    headquarters: sponsor.headquarters,
    founded: sponsor.founded,
    description: sponsor.description,
    primaryContact: { ...sponsor.primaryContact },
    secondaryContact: sponsor.secondaryContact
      ? { ...sponsor.secondaryContact }
      : undefined,
    internalNotes: sponsor.internalNotes,
  };
}

const defaultInput = (): SponsorInput => ({
  companyName: "",
  industry: "Gaming",
  status: "prospect",
  website: "",
  headquarters: "",
  founded: "",
  description: "",
  primaryContact: emptyContact(),
  internalNotes: "",
});

export function SponsorFormModal({
  open,
  onClose,
  sponsor,
}: SponsorFormModalProps) {
  const router = useRouter();
  const isEdit = !!sponsor;
  const [form, setForm] = useState<SponsorInput>(defaultInput());
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(sponsor ? sponsorToInput(sponsor) : defaultInput());
      setError("");
    }
  }, [open, sponsor]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = isEdit
      ? await updateSponsor(sponsor!.id, form)
      : await createSponsor(form);

    if ("error" in result && result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    onClose();
    router.refresh();
    if (!isEdit && "id" in result && result.id) {
      router.push(`/sponsors/${result.id}`);
    }
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-border bg-surface-raised shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-border bg-surface-raised px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-white">
              {isEdit ? "Edit Sponsor" : "Add Sponsor"}
            </h2>
            <p className="text-xs text-gray-500">
              {isEdit
                ? "Update brand partnership details"
                : "Register a new brand partnership"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-surface-overlay hover:text-gray-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {error && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-300">
              Company Name
            </label>
            <input
              type="text"
              value={form.companyName}
              onChange={(e) =>
                setForm({ ...form, companyName: e.target.value })
              }
              placeholder="Acme Corp"
              required
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-gray-200 placeholder:text-gray-600 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-300">
                Industry
              </label>
              <select
                value={form.industry}
                onChange={(e) =>
                  setForm({ ...form, industry: e.target.value as Industry })
                }
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-gray-200 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30"
              >
                {industries.map((i) => (
                  <option key={i} value={i}>
                    {i}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-300">
                Status
              </label>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value as SponsorStatus })
                }
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-gray-200 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30"
              >
                {sponsorStatuses.map((s) => (
                  <option key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-300">
                Contact Name
              </label>
              <input
                type="text"
                value={form.primaryContact.name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    primaryContact: {
                      ...form.primaryContact,
                      name: e.target.value,
                    },
                  })
                }
                placeholder="Jane Smith"
                required
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-gray-200 placeholder:text-gray-600 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-300">
                Contact Title
              </label>
              <input
                type="text"
                value={form.primaryContact.title}
                onChange={(e) =>
                  setForm({
                    ...form,
                    primaryContact: {
                      ...form.primaryContact,
                      title: e.target.value,
                    },
                  })
                }
                placeholder="Partnerships Manager"
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-gray-200 placeholder:text-gray-600 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-300">
                Contact Email
              </label>
              <input
                type="email"
                value={form.primaryContact.email}
                onChange={(e) =>
                  setForm({
                    ...form,
                    primaryContact: {
                      ...form.primaryContact,
                      email: e.target.value,
                    },
                  })
                }
                placeholder="jane@company.com"
                required
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-gray-200 placeholder:text-gray-600 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-300">
                Contact Phone
              </label>
              <input
                type="tel"
                value={form.primaryContact.phone}
                onChange={(e) =>
                  setForm({
                    ...form,
                    primaryContact: {
                      ...form.primaryContact,
                      phone: e.target.value,
                    },
                  })
                }
                placeholder="+1 (555) 123-4567"
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-gray-200 placeholder:text-gray-600 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-300">
              Website
            </label>
            <input
              type="url"
              value={form.website}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
              placeholder="https://company.com"
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-gray-200 placeholder:text-gray-600 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-300">
                Headquarters
              </label>
              <input
                type="text"
                value={form.headquarters}
                onChange={(e) =>
                  setForm({ ...form, headquarters: e.target.value })
                }
                placeholder="City, Country"
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-gray-200 placeholder:text-gray-600 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-300">
                Founded
              </label>
              <input
                type="text"
                value={form.founded}
                onChange={(e) => setForm({ ...form, founded: e.target.value })}
                placeholder="e.g. 2005"
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-gray-200 placeholder:text-gray-600 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-300">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              rows={2}
              placeholder="Brief overview of the brand and partnership focus..."
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-gray-200 placeholder:text-gray-600 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-300">
              Internal Notes
            </label>
            <textarea
              value={form.internalNotes}
              onChange={(e) =>
                setForm({ ...form, internalNotes: e.target.value })
              }
              rows={2}
              placeholder="Confidential notes for your team..."
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-gray-200 placeholder:text-gray-600 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-400 transition-colors hover:bg-surface-overlay hover:text-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-dark disabled:opacity-50"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? "Save Changes" : "Add Sponsor"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
