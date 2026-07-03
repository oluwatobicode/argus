import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router";
import { Modal } from "../../../ui/Modal";
import { Button } from "../../../ui/Button";
import { Input } from "../../../ui/Input";
import { useCreateProject } from "../../../hooks/useProjects";
import { HugeiconsIcon } from "@hugeicons/react";
import { CodeFolderIcon } from "@hugeicons/core-free-icons";

const schema = z.object({
  name: z.string().min(1, "Project name is required"),
});
type Values = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
}

export function NewProjectModal({ open, onClose }: Props) {
  const navigate = useNavigate();
  const create = useCreateProject();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  const close = () => {
    reset();
    onClose();
  };

  const onSubmit = (values: Values) => {
    create.mutate(values.name, {
      onSuccess: (project) => {
        close();
        navigate(`/projects/${project.id}/onboarding`);
      },
    });
  };

  return (
    <Modal open={open} onClose={close}>
      <div className="flex size-12 mb-5 items-center justify-center rounded-2xl bg-[#182114] text-[#9fe871]">
        <HugeiconsIcon icon={CodeFolderIcon} />
      </div>
      <h2 className="text-2xl font-bold tracking-tight">New project</h2>
      <p className="mt-1 text-sm text-text-2">
        A project is one app you want to monitor.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6" noValidate>
        <Input
          label="Project name"
          placeholder="Marketing site"
          error={errors.name?.message}
          autoFocus
          {...register("name")}
        />
        <div className="mt-6 grid grid-cols-2 gap-3">
          <Button type="button" variant="secondary" onClick={close}>
            Cancel
          </Button>
          <Button type="submit" loading={create.isPending}>
            Create project
          </Button>
        </div>
      </form>
    </Modal>
  );
}
