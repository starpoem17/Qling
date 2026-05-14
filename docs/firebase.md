# Firebase deployment

The web app initializes Firestore with the named database from `firebase-applet-config.json`:

```text
projectId: ai-studio-applet-webapp-81285
databaseId: ai-studio-5b923681-2d77-477b-ae6d-a04fc4c79fb2
```

Deploy Firestore rules to that database with:

```sh
npx firebase deploy --project ai-studio-applet-webapp-81285 --only firestore:ai-studio-5b923681-2d77-477b-ae6d-a04fc4c79fb2
```

