"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "../lib/utils"
import { Button } from "../components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../components/ui/command"
import {
  Card,
  CardContent,
  CardHeader,
} from "../components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/ui/popover"

import { useGithubStore } from "../lib/store"
import { Octokit } from "@octokit/core"

type Repo = {
  value: string
  label: string
}

let repos: Repo[] = [];

export function RepoSelector() {
  const [open, setOpen] = React.useState(false)
  const { githubToken, user, repo: r, setBlogRepo } = useGithubStore()

  if(!githubToken) return null;

  const octokit = new Octokit({
    auth: githubToken,
  })

  octokit.request('GET /users/{username}/repos', { username: user.login }).then((res) => {
    repos = [];
    res.data.forEach((repo) => repos.push({value: repo.name, label: repo.name}))
  })

  return (
    <div className="flex justify-center h-screen items-center">
      <Card>
        <CardHeader className="font-mono">Select the repository of your blog.</CardHeader>
      <CardContent className="flex items-center h-full">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-[200px] justify-between"
          >
            Select a repository
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0">
          <Command>
            <CommandInput placeholder="Search repository..." />
            <CommandEmpty>No repository found.</CommandEmpty>
            <CommandList>
              <CommandGroup>
                {repos.map((repo) => (
                  <CommandItem
                    key={repo.value}
                    value={repo.value}
                    onSelect={(currentValue: any) => {
                      setBlogRepo(currentValue);
                      setOpen(false)
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        r === repo.value ? "opacity-100" : "opacity-0"
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
      </CardContent>
      </Card>
    </div>
  )
}