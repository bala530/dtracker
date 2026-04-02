import { useParams, Link } from "wouter";
import { useState, useRef } from "react";
import { format } from "date-fns";
import { 
  useGetDefect, 
  useUpdateDefect, 
  useDeleteDefect,
  useListComments,
  useAddComment,
  useListAttachments,
  useAddAttachment,
  getGetDefectQueryKey,
  getListCommentsQueryKey,
  getListAttachmentsQueryKey
} from "@workspace/api-client-react";
import { useUpload } from "@workspace/object-storage-web";
import { useQueryClient } from "@tanstack/react-query";

import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DefectStatusBadge } from "@/components/defect-status-badge";
import { ChevronLeftIcon, Trash2Icon, Loader2, MessageSquareIcon, PaperclipIcon, Edit2Icon, FileIcon, ImageIcon, UploadIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";

const ENVIRONMENTS = ["SBX", "DEV", "QAS", "PRD"] as const;

export default function DefectDetail() {
  const { id: idParam } = useParams<{ id: string }>();
  const id = parseInt(idParam || "0", 10);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: defect, isLoading: isDefectLoading } = useGetDefect(id, {
    query: {
      enabled: !!id,
      queryKey: getGetDefectQueryKey(id)
    }
  });

  const { data: comments, isLoading: isCommentsLoading } = useListComments(id, {
    query: {
      enabled: !!id,
      queryKey: getListCommentsQueryKey(id)
    }
  });

  const { data: attachments, isLoading: isAttachmentsLoading } = useListAttachments(id, {
    query: {
      enabled: !!id,
      queryKey: getListAttachmentsQueryKey(id)
    }
  });

  const updateDefect = useUpdateDefect();
  const deleteDefect = useDeleteDefect();
  const addComment = useAddComment();
  const addAttachment = useAddAttachment();
  const { uploadFile, isUploading } = useUpload();

  const [isEditing, setIsEditing] = useState(false);
  const [editDesc, setEditDesc] = useState("");
  const [editEnv, setEditEnv] = useState("");

  const handleUpdateStatus = (newStatus: "reported" | "ready_to_retest" | "closed") => {
    updateDefect.mutate({ id, data: { status: newStatus } }, {
      onSuccess: (data) => {
        queryClient.setQueryData(getGetDefectQueryKey(id), (old: any) => 
          old ? { ...old, status: data.status } : old
        );
        toast({ title: "Status updated" });
      }
    });
  };

  const handleSaveEdits = () => {
    updateDefect.mutate({ id, data: { description: editDesc, environment: editEnv } }, {
      onSuccess: (data) => {
        queryClient.setQueryData(getGetDefectQueryKey(id), (old: any) => 
          old ? { ...old, description: data.description, environment: data.environment } : old
        );
        setIsEditing(false);
        toast({ title: "Defect updated" });
      }
    });
  };

  const startEditing = () => {
    if (defect) {
      setEditDesc(defect.description);
      setEditEnv(defect.environment);
      setIsEditing(true);
    }
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this defect? This action cannot be undone.")) {
      deleteDefect.mutate({ id }, {
        onSuccess: () => {
          toast({ title: "Defect deleted" });
          window.location.href = "/";
        }
      });
    }
  };

  // Comment state
  const [commentText, setCommentText] = useState("");
  const [commentAuthor, setCommentAuthor] = useState("");

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !commentAuthor.trim()) return;

    addComment.mutate({ id, data: { text: commentText, author: commentAuthor } }, {
      onSuccess: (newComment) => {
        queryClient.setQueryData(getListCommentsQueryKey(id), (old: any) => 
          old ? [...old, newComment] : [newComment]
        );
        setCommentText("");
      }
    });
  };

  // File upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    if (fileInputRef.current) fileInputRef.current.value = "";

    setIsUploadingFile(true);
    for (const file of files) {
      try {
        const uploaded = await uploadFile(file);
        if (uploaded) {
          const fileUrl = `/api/storage${uploaded.objectPath}`;
          await new Promise<void>((resolve, reject) => {
            addAttachment.mutate({
              id,
              data: {
                fileName: file.name,
                fileUrl,
                fileSize: file.size,
                mimeType: file.type || undefined,
              },
            }, {
              onSuccess: (newAttachment) => {
                queryClient.setQueryData(getListAttachmentsQueryKey(id), (old: any) =>
                  old ? [...old, newAttachment] : [newAttachment]
                );
                resolve();
              },
              onError: reject,
            });
          });
        }
      } catch {
        toast({ title: `Failed to upload ${file.name}`, variant: "destructive" });
      }
    }
    setIsUploadingFile(false);
    toast({ title: `${files.length === 1 ? "File" : `${files.length} files`} attached successfully` });
  };

  if (isDefectLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-pulse">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!defect) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold">Defect not found</h2>
        <Link href="/" className="text-primary mt-4 inline-block">Return to dashboard</Link>
      </div>
    );
  }

  const uploadBusy = isUploadingFile || isUploading;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <Link href="/" className="inline-flex items-center text-sm font-mono text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeftIcon className="w-4 h-4 mr-1" />
          Back to Dashboard
        </Link>
        <div className="flex items-center gap-2">
          <Select value={defect.status} onValueChange={(v) => handleUpdateStatus(v as any)}>
            <SelectTrigger className="w-[160px] h-8 text-xs font-mono rounded-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent rounded="none">
              <SelectItem value="reported">Reported</SelectItem>
              <SelectItem value="ready_to_retest">Ready to Retest</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" className="h-8 w-8 rounded-none border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground" onClick={handleDelete} disabled={deleteDefect.isPending}>
            {deleteDefect.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2Icon className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      <div className="bg-card border border-border">
        <div className="border-b border-border p-6 flex items-start justify-between bg-muted/20">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-mono font-bold tracking-tight">{defect.defectId}</h1>
              <DefectStatusBadge status={defect.status} />
            </div>
            <div className="text-sm text-muted-foreground font-mono">
              Reported {format(new Date(defect.createdAt), "MMM d, yyyy h:mm a")}
            </div>
          </div>
          {!isEditing && (
            <Button variant="ghost" size="sm" onClick={startEditing} className="font-mono text-xs rounded-none">
              <Edit2Icon className="w-3.5 h-3.5 mr-2" /> Edit Details
            </Button>
          )}
        </div>
        
        <div className="p-6 space-y-6">
          {isEditing ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="font-mono text-xs uppercase text-muted-foreground">Description</Label>
                <Textarea 
                  value={editDesc} 
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="min-h-[150px] font-sans text-base rounded-none"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-mono text-xs uppercase text-muted-foreground">Environment</Label>
                <Select value={editEnv} onValueChange={setEditEnv}>
                  <SelectTrigger className="rounded-none font-mono text-sm">
                    <SelectValue placeholder="Select environment" />
                  </SelectTrigger>
                  <SelectContent rounded="none">
                    {ENVIRONMENTS.map((env) => (
                      <SelectItem key={env} value={env}>{env}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setIsEditing(false)} className="rounded-none">Cancel</Button>
                <Button onClick={handleSaveEdits} disabled={updateDefect.isPending} className="rounded-none">
                  {updateDefect.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div>
                <Label className="font-mono text-xs uppercase text-muted-foreground mb-2 block">Description</Label>
                <div className="whitespace-pre-wrap font-sans text-base leading-relaxed text-foreground">
                  {defect.description}
                </div>
              </div>
              
              <div className="pt-4 border-t border-border/50">
                <Label className="font-mono text-xs uppercase text-muted-foreground mb-2 block">Environment</Label>
                <div className="font-mono text-sm inline-block bg-muted px-2 py-1 border border-border">
                  {defect.environment}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <h3 className="font-mono text-sm uppercase font-bold tracking-wider flex items-center border-b border-border pb-2">
            <MessageSquareIcon className="w-4 h-4 mr-2" /> Comments
          </h3>
          
          <div className="space-y-4">
            {isCommentsLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : comments?.length === 0 ? (
              <p className="text-sm text-muted-foreground italic font-mono">No comments yet.</p>
            ) : (
              comments?.map(comment => (
                <div key={comment.id} className="bg-card border border-border p-4 flex flex-col gap-2">
                  <div className="flex items-center justify-between border-b border-border/50 pb-2 mb-1">
                    <span className="font-mono font-bold text-sm">{comment.author}</span>
                    <span className="font-mono text-xs text-muted-foreground">{format(new Date(comment.createdAt), "MMM d, yyyy h:mm a")}</span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{comment.text}</p>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleAddComment} className="bg-muted/30 border border-border p-4 space-y-3">
            <h4 className="font-mono text-xs uppercase font-bold text-muted-foreground">Add Comment</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="md:col-span-1">
                <Input 
                  placeholder="Your Name" 
                  value={commentAuthor} 
                  onChange={e => setCommentAuthor(e.target.value)} 
                  className="rounded-none bg-background text-sm"
                  required
                />
              </div>
              <div className="md:col-span-3 flex gap-2">
                <Input 
                  placeholder="Type a comment..." 
                  value={commentText} 
                  onChange={e => setCommentText(e.target.value)} 
                  className="rounded-none bg-background text-sm flex-1"
                  required
                />
                <Button type="submit" disabled={addComment.isPending || !commentText.trim() || !commentAuthor.trim()} className="rounded-none whitespace-nowrap">
                  {addComment.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Post"}
                </Button>
              </div>
            </div>
          </form>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <h3 className="font-mono text-sm uppercase font-bold tracking-wider flex items-center">
              <PaperclipIcon className="w-4 h-4 mr-2" /> Attachments
            </h3>
          </div>

          <div className="space-y-2">
            {isAttachmentsLoading ? (
              <Skeleton className="h-12 w-full" />
            ) : attachments?.length === 0 ? (
              <p className="text-sm text-muted-foreground italic font-mono">No attachments yet.</p>
            ) : (
              attachments?.map(attachment => (
                <a 
                  key={attachment.id} 
                  href={attachment.fileUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-card border border-border hover:bg-muted transition-colors group"
                >
                  <div className="bg-muted p-2 border border-border group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-colors">
                    {attachment.mimeType?.startsWith("image/") ? (
                      <ImageIcon className="w-4 h-4" />
                    ) : (
                      <FileIcon className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                      {attachment.fileName}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono truncate">
                      {format(new Date(attachment.createdAt), "MMM d, yyyy")}
                    </div>
                  </div>
                </a>
              ))
            )}
          </div>

          <div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.txt,.log,.csv,.zip"
              className="hidden"
              onChange={handleFileChange}
              id="detail-file-upload"
            />
            <label
              htmlFor="detail-file-upload"
              className={`flex items-center justify-center gap-2 cursor-pointer border border-dashed border-border px-4 py-3 text-sm text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors ${uploadBusy ? "opacity-50 pointer-events-none" : ""}`}
            >
              {uploadBusy ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <UploadIcon className="w-4 h-4" />
                  Upload Attachment
                </>
              )}
            </label>
            <p className="mt-1.5 text-xs text-muted-foreground">Images, PDF, text, log, CSV, zip</p>
          </div>
        </div>
      </div>
    </div>
  );
}
