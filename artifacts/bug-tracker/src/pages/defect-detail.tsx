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
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DefectStatusBadge } from "@/components/defect-status-badge";
import { ChevronLeftIcon, Trash2Icon, Loader2, MessageSquareIcon, PaperclipIcon, CheckIcon, Edit2Icon, LinkIcon, FileIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

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

  // Attachment state
  const [attachName, setAttachName] = useState("");
  const [attachUrl, setAttachUrl] = useState("");
  const [isAttachDialogOpen, setIsAttachDialogOpen] = useState(false);

  const handleAddAttachment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!attachName.trim() || !attachUrl.trim()) return;

    addAttachment.mutate({ id, data: { fileName: attachName, fileUrl: attachUrl } }, {
      onSuccess: (newAttachment) => {
        queryClient.setQueryData(getListAttachmentsQueryKey(id), (old: any) => 
          old ? [...old, newAttachment] : [newAttachment]
        );
        setAttachName("");
        setAttachUrl("");
        setIsAttachDialogOpen(false);
      }
    });
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
                <Input 
                  value={editEnv} 
                  onChange={(e) => setEditEnv(e.target.value)}
                  className="rounded-none font-mono text-sm"
                />
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
            <Dialog open={isAttachDialogOpen} onOpenChange={setIsAttachDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs rounded-none font-mono">
                  + Add Link
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-none border-border">
                <DialogHeader>
                  <DialogTitle className="font-mono uppercase tracking-wider text-sm">Add Attachment Link</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddAttachment} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label className="font-mono text-xs">File Name / Description</Label>
                    <Input 
                      placeholder="e.g., Error Screenshot, Log File" 
                      value={attachName} 
                      onChange={e => setAttachName(e.target.value)}
                      className="rounded-none"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-mono text-xs">URL (Google Drive, Dropbox, etc.)</Label>
                    <Input 
                      type="url"
                      placeholder="https://..." 
                      value={attachUrl} 
                      onChange={e => setAttachUrl(e.target.value)}
                      className="rounded-none"
                      required
                    />
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline" type="button" className="rounded-none">Cancel</Button>
                    </DialogClose>
                    <Button type="submit" disabled={addAttachment.isPending || !attachName.trim() || !attachUrl.trim()} className="rounded-none">
                      {addAttachment.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Add Link
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-2">
            {isAttachmentsLoading ? (
              <Skeleton className="h-12 w-full" />
            ) : attachments?.length === 0 ? (
              <p className="text-sm text-muted-foreground italic font-mono">No attachments.</p>
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
                    <FileIcon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                      {attachment.fileName}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono truncate">
                      {format(new Date(attachment.createdAt), "MMM d, yyyy")}
                    </div>
                  </div>
                  <LinkIcon className="w-4 h-4 text-muted-foreground group-hover:text-primary opacity-50 group-hover:opacity-100 transition-all" />
                </a>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
