import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Octokit } from "@octokit/core";
import React, { useEffect } from 'react'; // Import useEffect

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
    token: z.string().min(1, { message: 'Token cannot be empty.'}).refine(token => token.startsWith('ghp_') || token.startsWith('github_pat_'), { message: 'Token must start with ghp_ or github_pat_' }),
});

const GithubAuthCard = () => {
    const { setGithubToken, setUser, githubToken } = useGithubStore(); // Added githubToken to check if already loaded
    
    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: { token: '' }, // Set default value
    });
    
    async function onSubmit(data: z.infer<typeof FormSchema>) {
        try {
            await window.api.saveToken(data.token);
            const octokit = new Octokit({ auth: data.token });
            const response = await octokit.request('GET /user');
            setUser(response.data);
            setGithubToken(data.token); // Update Zustand store after successful save and fetch
        } catch (error) {
            console.error("Failed to save token or fetch user:", error);
            // Display error to user in the form
            form.setError("token", { type: "manual", message: "Failed to verify token. It might be invalid, expired, or lack necessary permissions. Please check the token and try again." });
        }
    };

    // Link to GitHub token settings
    const GITHUB_TOKEN_URL = "https://github.com/settings/tokens?type=beta";

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
                                        <Textarea placeholder="ghp_..." {...field}/>
                                    </FormControl>
                                    <FormDescription className="pb-2 pt-2">
                                        <p>Generate a new personal access token <a href={GITHUB_TOKEN_URL} target="_blank" rel="noopener noreferrer">here</a>. Ensure it has repository access.</p>
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                            />
                            <Button type="submit" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting ? "Saving..." : "Save Token"}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
       </div>
    )
}

export default GithubAuthCard;