import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Octokit } from "@octokit/core";

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "../components/ui/card";
import { Button } from "./ui/button";
import { Form, FormControl, FormDescription, FormMessage, FormField, FormItem } from "./ui/form";
import { Textarea } from "../components/ui/textarea";
import { useGithubStore } from "../lib/store";

const FormSchema = z.object({
    token: z.string().startsWith('ghp_', { message: 'Token must start with ghp_' }),
})

const GithubAuthCard = () => {
    const { setGithubToken, setUser } = useGithubStore();
    
    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
    });
    
    function onSubmit(data: z.infer<typeof FormSchema>) {
        setGithubToken(data.token);

        const octokit = new Octokit({ auth: data.token });
        octokit.request('GET /user').then((res) => {
            setUser(res.data);
        })
    };

    // const { setGithubToken } = useGithubStore();
    return (
       <div className="bg-primary flex items-center justify-center h-screen backdrop-blur-lg"> 
            <Card>
                <CardHeader>
                    <CardTitle className="font-mono text-sm flex items-start">Enter GitHub Personal Access Token</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)}>
                            <FormField control={form.control} name="token" render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <Textarea placeholder="Github Token" {...field}/>
                                    </FormControl>
                                    <FormDescription className="pb-2 pt-2">
                                        <p>Generate a new personal access token <a href="#">here</a></p>
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                            />
                            <Button type="submit">Save Token</Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
       </div>
    )
}

export default GithubAuthCard;