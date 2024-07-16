import { useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { EditorView } from '@codemirror/view';
import { markdown } from '@codemirror/lang-markdown';
import { Octokit } from '@octokit/core';

import { RepoSelector } from './components/RepoSelector';
import GithubAuthCard from './components/GithubAuth' 
import { Button } from './components/ui/button';
import { useGithubStore } from './lib/store';



function App(): JSX.Element {
	const [docValue, setDocValue] = useState('');
	const { githubToken, repo, user } = useGithubStore();
	if(githubToken === '') {
		return <GithubAuthCard/>
	}

	if (Object.keys(repo).length === 0){
		return <RepoSelector />;
	}

	return (
		<>
			<h3 className="flex justify-center">Whizz.</h3>
			<div className="flex justify-center" id="editor">Write your blog post here.</div>
			<CodeMirror extensions={[markdown(), EditorView.editable.of(true)]} onChange={(e) => (
				setDocValue(e)
			)} />

			<Button onClick={() => {
				// console.log(btoa(docValue));

				const octokit = new Octokit({ auth: githubToken });
				octokit.request('PUT /repos/{owner}/{repo}/contents/{path}', {
					owner: user.login,
					repo: repo,
					path: 'src/content/blog/' + Date.now() + '.md',
					message: 'Add a new blog post',
					content: btoa(docValue),
					headers: {
						'X-GitHub-Api-Version': '2022-11-28'
					}
				})
			}}>Publish</Button>
		</>
	);
}

export default App;
