import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

type GithubStore = {
    githubToken: string | null, // Can be null initially
    user: any, // Consider defining a more specific type for user
    repo: string,
    blogDirectory: string, // New state for blog directory
    setGithubToken: (token: string | null) => void,
    setUser: (user: any) => void,
    setBlogRepo: (repo: string) => void,
    setBlogDirectory: (dir: string) => void, // New setter
}

const useGithubStore = create(persist<GithubStore>(
    (set) => ({
        githubToken: null,
        user: {},
        repo: '',
        blogDirectory: 'src/content/blog/', // Default value
        setGithubToken: (token: string | null) => set({ githubToken: token }),
        setUser: (user: any) => set({ user: user }),
        setBlogRepo: (repo: string) => set({ repo: repo }),
        setBlogDirectory: (dir: string) => set({ blogDirectory: dir }), // Implement setter
    }),
    {
        name: 'github-store',
        storage: createJSONStorage(() => localStorage),
    }
));

export { useGithubStore };