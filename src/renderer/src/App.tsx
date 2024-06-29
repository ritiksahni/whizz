import CodeMirror from '@uiw/react-codemirror';
import { EditorView } from '@codemirror/view';
import { markdown } from '@codemirror/lang-markdown';
import { useUser } from '@clerk/clerk-react';

import {
	SignedIn,
	SignedOut,
	SignInButton,
	UserButton,
} from '@clerk/clerk-react';

function App(): JSX.Element {
	const { user } = useUser();
	user ? console.log(user) : console.log('No user');
	return (
		<>
			<h3 className="flex justify-center">Whizz.</h3>
			<CodeMirror extensions={[markdown(), EditorView.editable.of(true)]} />

			<SignedOut>
				<SignInButton mode="modal" fallbackRedirectUrl="/" />
			</SignedOut>
			<SignedIn>
				<UserButton />
			</SignedIn>
		</>
	);
}

export default App;
