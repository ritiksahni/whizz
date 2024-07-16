import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

type GithubStore = {
    githubToken: string,
    user: any,
    repo: string,
    setGithubToken: (token: string) => void,
    setUser: (user: any) => void,
    setBlogRepo: (repo: any) => void,
}

const useGithubStore = create(persist<GithubStore>(
    (set) => ({
        githubToken: '',
        user: {},
        repo: '',
        setGithubToken: (token: string) => set({ githubToken: token }),
        setUser: (user: any) => set({ user: user }),
        setBlogRepo: (repo: string) => set({ repo: repo }),
    }),
    {
        name: 'github-store',
        storage: createJSONStorage(() => localStorage),
    }
));

export { useGithubStore };