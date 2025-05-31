import React, { useState, useEffect } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { EditorView } from '@codemirror/view';
import { markdown as markdownLang } from '@codemirror/lang-markdown';
import { Octokit } from '@octokit/core';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import { useMutation, useQueryClient } from '@tanstack/react-query'; // Import useMutation and useQueryClient

import { RepoSelector } from './components/RepoSelector';
import GithubAuthCard from './components/GithubAuth';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input'; // Import Input
import { Textarea } from './components/ui/textarea'; // Import Textarea
import { Label } from './components/ui/label'; // Import Label
import { useGithubStore } from './lib/store';

function joinPaths(base: string, addition: string): string {
    const baseNormalized = base.endsWith('/') ? base : (base === '' ? '' : base + '/');
    const additionNormalized = addition.startsWith('/') ? addition.substring(1) : addition;
    // Ensure no double slashes if addition is empty or base is empty
    if (additionNormalized === '') return baseNormalized.endsWith('/') ? baseNormalized.slice(0, -1) : baseNormalized;
    if (baseNormalized === '') return additionNormalized;
    return `${baseNormalized}${additionNormalized}`;
}

// Define the structure for mutation variables
interface PublishVariables {
    filename: string; // Added filename for context in mutation, though not directly used by API call itself beyond path
    commitMessage: string;
    docValue: string;
    owner: string;
    repo: string;
    path: string;
    githubToken: string;
}

// Define the actual mutation function
const publishPostMutationFn = async (variables: PublishVariables) => {
    const { githubToken, owner, repo, path, commitMessage, docValue } = variables;
    const octokit = new Octokit({ auth: githubToken });
    return octokit.request('PUT /repos/{owner}/{repo}/contents/{path}', {
        owner,
        repo,
        path,
        message: commitMessage,
        content: btoa(unescape(encodeURIComponent(docValue))),
        headers: {
            'X-GitHub-Api-Version': '2022-11-28'
        }
    });
};

function App(): JSX.Element {
    const [docValue, setDocValue] = useState('');
    const [customFilename, setCustomFilename] = useState('');
    const [commitMessage, setCommitMessage] = useState('');

    const { githubToken, repo, user, blogDirectory, setGithubToken, setUser } = useGithubStore();
    const [isLoadingToken, setIsLoadingToken] = useState(true); // Start with true to load token

    const queryClient = useQueryClient(); // Get query client instance

    useEffect(() => {
        const loadTokenAndUser = async () => {
            setIsLoadingToken(true);
            try {
                const token = await window.api.getToken();
                if (token) {
                    setGithubToken(token);
                    try {
                        const octokit = new Octokit({ auth: token });
                        const response = await octokit.request('GET /user');
                        setUser(response.data);
                    } catch (userError) {
                        console.error("Failed to fetch user with token:", userError);
                        await window.api.deleteToken(); // Clear invalid token
                        setGithubToken(null); // Use null for token absence
                        setUser({});
                        alert("Your GitHub token appears to be invalid or expired, or it lacks permissions to fetch user data. Please generate a new token and re-authenticate.");
                    }
                } else {
                    setGithubToken(null); // Ensure token is null if not found
                    setUser({});
                }
            } catch (error) {
                console.error("Failed to load token from store:", error);
                setGithubToken(null);
                setUser({});
            } finally {
                setIsLoadingToken(false);
            }
        };
        loadTokenAndUser();
    }, [setGithubToken, setUser]); // Dependencies

    const publishMutation = useMutation<unknown, Error, PublishVariables>(publishPostMutationFn, {
        onSuccess: (_data, variables) => { // Access variables here
            alert(`Blog post "${variables.filename}" published successfully!`);
            setDocValue('');
            setCustomFilename('');
            setCommitMessage('');
            // queryClient.invalidateQueries(['posts', repo]); // Example
        },
        onError: (error) => {
            console.error("Failed to publish file:", error);
            alert(`Failed to publish file: ${error.message}. Please check your repository permissions and network connection.`);
        }
    });

    if (isLoadingToken) {
        return <div className="flex justify-center items-center h-screen text-lg">Loading application data...</div>;
    }

    // If no token OR no user data (after attempting to load), show auth card.
    if (!githubToken || Object.keys(user).length === 0) {
        return <GithubAuthCard />;
    }

    // If token and user are present, but no repo selected, show repo selector.
    if (Object.keys(repo).length === 0) {
        return <RepoSelector />;
    }

    const handlePublish = async () => {
        if (!user?.login || !repo || !githubToken) {
            alert("Error: User data, repository selection, or GitHub token is missing. Please ensure you are logged in and have selected a repository.");
            return;
        }
        if (!docValue.trim()) {
            alert("Error: Cannot publish an empty document. Please write some content.");
            return;
        }

        let finalFilename = customFilename.trim();
        if (!finalFilename) {
            finalFilename = `post-${Date.now()}.md`;
        } else if (!finalFilename.endsWith('.md') && !finalFilename.endsWith('.mdx')) {
            finalFilename += '.md';
        }

        const finalCommitMessage = commitMessage.trim() || `feat: Add new blog post ${finalFilename}`;

        // Ensure blogDirectory is handled correctly (empty means root)
        const directory = blogDirectory.trim();
        const fullPath = joinPaths(directory, finalFilename);
        // GitHub API path should not start with a slash
        const effectivePath = fullPath.startsWith('/') ? fullPath.substring(1) : fullPath;

        publishMutation.mutate({
            githubToken,
            owner: user.login,
            repo,
            path: effectivePath,
            commitMessage: finalCommitMessage,
            docValue,
            filename: finalFilename
        });
    };

    return (
        <div className="container mx-auto p-4 max-w-6xl"> {/* Added max-w for better layout on large screens */}
            <header className="text-center my-6">
              <h1 className="text-3xl font-bold">Whizz</h1>
              <p className="text-muted-foreground">Your Markdown Blog Publisher</p>
            </header>

            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <div className="md:w-1/2 w-full">
                <h2 className="text-xl font-semibold mb-2">Editor</h2>
                <CodeMirror
                  value={docValue}
                  height="55vh"
                  extensions={[markdownLang(), EditorView.editable.of(true)]}
                  onChange={(value) => setDocValue(value)}
                  theme="dark"
                />
              </div>
              <div className="md:w-1/2 w-full">
                <h2 className="text-xl font-semibold mb-2">Preview</h2>
                <div className="p-3 border rounded-md bg-white dark:bg-gray-800 h-[55vh] overflow-auto prose dark:prose-invert max-w-none">
                  <ReactMarkdown
                    children={docValue}
                    rehypePlugins={[rehypeRaw]}
                    remarkPlugins={[remarkGfm]}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 bg-slate-50 dark:bg-slate-800 p-4 rounded-lg shadow"> {/* Added background and shadow */}
              <div>
                <Label htmlFor="filename" className="font-semibold text-sm">Custom Filename (optional)</Label>
                <Input
                  id="filename"
                  type="text"
                  placeholder="my-post.md (auto-generates if blank)"
                  value={customFilename}
                  onChange={(e) => setCustomFilename(e.target.value)}
                  className="mt-1 w-full"
                />
                <p className="text-xs text-muted-foreground mt-1">If no extension, '.md' will be added.</p>
              </div>
              <div>
                <Label htmlFor="commitMessage" className="font-semibold text-sm">Commit Message (optional)</Label>
                <Textarea
                  id="commitMessage"
                  placeholder="Default: feat: Add new blog post [filename]"
                  value={commitMessage}
                  onChange={(e) => setCommitMessage(e.target.value)}
                  className="mt-1 w-full"
                  rows={2}
                />
                 <p className="text-xs text-muted-foreground mt-1">A good commit message is helpful!</p>
              </div>
            </div>

            <div className="text-center">
              <Button
                onClick={handlePublish}
                disabled={!docValue.trim() || publishMutation.isLoading}
                className="px-6 py-3 text-lg" // Made button larger
              >
                {publishMutation.isLoading ? 'Publishing...' : 'Publish Post'}
              </Button>
              {publishMutation.isError && (
                // Added more specific error styling
                <p className="text-red-600 dark:text-red-400 mt-3 bg-red-100 dark:bg-red-900 p-2 rounded-md">
                    Failed to publish: {publishMutation.error?.message || "Unknown error"}
                </p>
              )}
            </div>
        </div>
    );
}

export default App;
