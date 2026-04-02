import { useRef, useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCreateDefect, useAddAttachment } from "@workspace/api-client-react";
import { useUpload } from "@workspace/object-storage-web";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeftIcon, Loader2, PaperclipIcon, XIcon, ImageIcon } from "lucide-react";
import { Link } from "wouter";

const formSchema = z.object({
  description: z.string().min(5, "Description must be at least 5 characters"),
  environment: z.string().min(2, "Environment is required"),
  status: z.enum(["reported", "ready_to_retest", "closed"]).default("reported"),
});

type FormValues = z.infer<typeof formSchema>;

export default function CreateDefect() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const createDefect = useCreateDefect();
  const addAttachment = useAddAttachment();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { uploadFile, isUploading } = useUpload();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: "",
      environment: "Production",
      status: "reported",
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setPendingFiles((prev) => [...prev, ...files]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      const defect = await new Promise<{ id: number; defectId: string }>((resolve, reject) => {
        createDefect.mutate({ data: values }, {
          onSuccess: resolve,
          onError: reject,
        });
      });

      for (const file of pendingFiles) {
        const uploaded = await uploadFile(file);
        if (uploaded) {
          const fileUrl = `/api/storage${uploaded.objectPath}`;
          await new Promise<void>((resolve, reject) => {
            addAttachment.mutate({
              id: defect.id,
              data: {
                fileName: file.name,
                fileUrl,
                fileSize: file.size,
                mimeType: file.type || undefined,
              },
            }, {
              onSuccess: () => resolve(),
              onError: reject,
            });
          });
        }
      }

      toast({
        title: "Defect logged successfully",
        description: `${defect.defectId} has been created${pendingFiles.length > 0 ? ` with ${pendingFiles.length} attachment${pendingFiles.length > 1 ? "s" : ""}` : ""}.`,
      });
      setLocation(`/defects/${defect.id}`);
    } catch {
      toast({
        title: "Failed to log defect",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const busy = isSubmitting || isUploading;

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div>
        <Link href="/" className="inline-flex items-center text-sm font-mono text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ChevronLeftIcon className="w-4 h-4 mr-1" />
          Back to Dashboard
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Log New Defect</h1>
        <p className="text-muted-foreground">Record a new software issue to track its resolution.</p>
      </div>

      <div className="bg-card border border-border p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-mono uppercase text-xs">Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Detailed steps to reproduce, expected vs actual behavior..."
                      className="min-h-[120px] rounded-none focus-visible:ring-primary"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="environment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-mono uppercase text-xs">Environment</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Production, Staging, macOS Chrome" className="rounded-none focus-visible:ring-primary" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-mono uppercase text-xs">Initial Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="rounded-none focus-visible:ring-primary">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent rounded="none">
                        <SelectItem value="reported">Reported</SelectItem>
                        <SelectItem value="ready_to_retest">Ready to Retest</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-3">
              <p className="font-mono uppercase text-xs text-muted-foreground">Screenshots / Attachments</p>

              {pendingFiles.length > 0 && (
                <ul className="space-y-2">
                  {pendingFiles.map((file, i) => (
                    <li key={i} className="flex items-center gap-3 bg-muted/40 border border-border px-3 py-2 text-sm">
                      {file.type.startsWith("image/") ? (
                        <ImageIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                      ) : (
                        <PaperclipIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                      )}
                      <span className="flex-1 truncate font-mono text-xs">{file.name}</span>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {(file.size / 1024).toFixed(0)} KB
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFile(i)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <XIcon className="w-3.5 h-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,.pdf,.txt,.log,.csv,.zip"
                  className="hidden"
                  onChange={handleFileChange}
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="inline-flex items-center gap-2 cursor-pointer border border-dashed border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors"
                >
                  <PaperclipIcon className="w-4 h-4" />
                  {pendingFiles.length === 0 ? "Attach screenshots or files" : "Add more files"}
                </label>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Supported: images, PDF, text, log, CSV, zip
                </p>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <Button
                type="submit"
                disabled={busy}
                className="font-mono uppercase tracking-wider text-xs rounded-none"
              >
                {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isUploading ? "Uploading files..." : isSubmitting ? "Submitting..." : "Submit Defect"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
