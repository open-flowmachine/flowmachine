"use client";

import { useQueryClient } from "@tanstack/react-query";
import { isNil } from "es-toolkit";
import { useState } from "react";
import { toast } from "sonner";
import { PlatformPageNotFoundError } from "@/component/platform/platform-page-not-found-error";
import { PlatformPageTemplate } from "@/component/platform/platform-page-template";
import { EditCredentialForm } from "@/feature/editable-credential-details/edit-credential-form";
import type { EditCredentialFormValues } from "@/feature/editable-credential-details/edit-credential-form-schema";
import { EditableCredentialDetails } from "@/feature/editable-credential-details/editable-credential-details";
import { useEditCredentialForm } from "@/feature/editable-credential-details/use-edit-credential-form";
import { useCopyToClipboard } from "@/hook/use-copy-to-clipboard";
import { makeGetCredentialQueryKey } from "@/lib/query/query-key";
import { useGetCredential } from "@/module/credential/use-get-credential";
import { useUpdateCredential } from "@/module/credential/use-update-credential";

type EditableCredentialDetailsPageProps = {
  id: string;
};

export function EditableCredentialDetailsPage({
  id,
}: EditableCredentialDetailsPageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [_, copyToClipboard] = useCopyToClipboard();

  const queryClient = useQueryClient();
  const { data, isPending, isError } = useGetCredential(id);
  const { mutateAsync } = useUpdateCredential();

  const form = useEditCredentialForm();

  const handleCopy = async (text: string) => {
    await copyToClipboard(text);
    toast.success("Copied to clipboard");
  };

  const handleEdit = () => {
    if (data) {
      if (data.type === "apiKey") {
        form.reset({
          type: "apiKey",
          name: data.name,
          apiKey: data.apiKey,
          expiredAt: data.expiredAt.slice(0, 16),
        });
      } else {
        form.reset({
          type: "basic",
          name: data.name,
          username: data.username,
          password: data.password,
          expiredAt: data.expiredAt.slice(0, 16),
        });
      }
    }
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleValidFormSubmit = async (formData: EditCredentialFormValues) => {
    try {
      await mutateAsync({ params: { id }, body: formData });
      await queryClient.invalidateQueries({
        queryKey: makeGetCredentialQueryKey(id),
      });
      toast.success("Credential updated successfully");
      setIsEditing(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to update credential");
    }
  };

  if (isNil(data) || isError) {
    return (
      <PlatformPageTemplate heading={data?.name ?? "Credential"}>
        <PlatformPageNotFoundError />
      </PlatformPageTemplate>
    );
  }

  return (
    <PlatformPageTemplate
      heading={data?.name ?? "Credential"}
      isPending={isPending}
    >
      <div className="max-w-2xl space-y-6">
        {isEditing ? (
          <EditCredentialForm
            credential={data}
            form={form}
            onCancel={handleCancel}
            onValidFormSubmit={handleValidFormSubmit}
            onInvalidFormSubmit={() => {}}
          />
        ) : (
          <EditableCredentialDetails
            credential={data}
            onEdit={handleEdit}
            onCopy={handleCopy}
          />
        )}
      </div>
    </PlatformPageTemplate>
  );
}
