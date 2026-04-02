import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCreateDefect } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeftIcon, Loader2 } from "lucide-react";
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

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: "",
      environment: "Production",
      status: "reported",
    },
  });

  const onSubmit = (values: FormValues) => {
    createDefect.mutate({ data: values }, {
      onSuccess: (data) => {
        toast({
          title: "Defect logged successfully",
          description: `${data.defectId} has been created.`,
        });
        setLocation(`/defects/${data.id}`);
      },
      onError: (error) => {
        toast({
          title: "Failed to log defect",
          description: error instanceof Error ? error.message : "An unknown error occurred",
          variant: "destructive",
        });
      }
    });
  };

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

            <div className="pt-4 flex justify-end">
              <Button 
                type="submit" 
                disabled={createDefect.isPending}
                className="font-mono uppercase tracking-wider text-xs rounded-none"
              >
                {createDefect.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Submit Defect
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
