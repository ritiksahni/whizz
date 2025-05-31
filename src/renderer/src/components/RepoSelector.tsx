"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Loader2, AlertTriangle } from "lucide-react";
import { useQuery } from '@tanstack/react-query';

import { cn } from "../lib/utils";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input"; // Import Input
import { Label } from "../components/ui/label"; // Import Label
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../components/ui/command";
import {
  Card,
  CardContent,
  CardDescription, // Import CardDescription
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/ui/popover";

import { useGithubStore } from "../lib/store";
import { Octokit } from "@octokit/core";

type Repo = {
  value: string;
  label: string;
};

const fetchRepos = async (githubToken: string, username: string): Promise<Repo[]> => {
  if (!githubToken || !username) {
    throw new Error("GitHub token or username is not available.");
  }
  const octokit = new Octokit({ auth: githubToken });
  const response = await octokit.request('GET /users/{username}/repos', {
    username: username,
    type: 'owner',
    sort: 'updated',
    direction: 'desc',
    per_page: 100,
  });
  return response.data.map((repo: any) => ({ value: repo.name, label: repo.name }));
};

export function RepoSelector() {
  const [open, setOpen] = React.useState(false);
  const {
    githubToken,
    user,
    repo: selectedRepo,
    setBlogRepo,
    blogDirectory, // Get blogDirectory
    setBlogDirectory // Get setBlogDirectory
  } = useGithubStore();

  const {
    data: repos = [],
    isLoading,
    isError,
    error
  } = useQuery<Repo[], Error>(
    ['userRepos', user?.login],
    () => fetchRepos(githubToken!, user!.login),
    {
      enabled: !!githubToken && !!user?.login,
      staleTime: 5 * 60 * 1000,
    }
  );

  const handleDirectoryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setBlogDirectory(event.target.value);
  };

  if (!githubToken || !user?.login) {
    return <div className="flex justify-center items-center h-screen"><p>Please authenticate first.</p></div>;
  }

  return (
    <div className="flex justify-center h-screen items-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="font-mono text-center">Configure Blog Repository</CardTitle>
          <CardDescription className="text-center">
            Select the repository and specify the directory for your blog posts.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4"> {/* Added space-y-4 */}
          {isLoading && (
            <div className="flex items-center space-x-2 mt-4">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Loading repositories...</span>
            </div>
          )}
          {isError && error && (
            <div className="flex flex-col items-center space-y-2 mt-4 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <span>Error fetching repositories: {error.message}. Check your network and token permissions.</span>
            </div>
          )}
          {!isLoading && !isError && (
            <>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-[300px] justify-between"
                  >
                    {selectedRepo
                      ? repos.find((repo) => repo.value === selectedRepo)?.label
                      : "Select a repository..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0">
                  <Command>
                    <CommandInput placeholder="Search repository..." />
                    <CommandEmpty>No repository found.</CommandEmpty>
                    <CommandList>
                      <CommandGroup>
                        {repos.map((repo) => (
                          <CommandItem
                            key={repo.value}
                            value={repo.value}
                            onSelect={(currentValue) => {
                              setBlogRepo(currentValue === selectedRepo ? "" : currentValue);
                              setOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedRepo === repo.value ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {repo.label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              <div className="w-[300px] space-y-2">
                <Label htmlFor="blogDirectory" className="font-mono">Blog Directory Path</Label>
                <Input
                  id="blogDirectory"
                  type="text"
                  placeholder="e.g., content/blog or posts/"
                  value={blogDirectory}
                  onChange={handleDirectoryChange}
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Path within the repository where Markdown files will be created.
                  Use a trailing slash if it's a directory (e.g., `posts/`).
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}