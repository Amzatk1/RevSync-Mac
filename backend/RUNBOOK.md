# RevSync Ops Runbook

## 1. Deploying Updates
```bash
# Apply Migrations
python manage.py migrate

# App is ready
```

## 2. Key Rotation
If the signing key is compromised:
1.  Generate new key: `python manage.py generate_keys` (Need to impl command or use python shell)
2.  Update `REVSYNC_SIGNING_PRIVATE_KEY` in Heroku/AWS.
3.  Deploy new Mobile App build with new Public Key.
4.  (Optional) Re-sign existing active tunes if strict check required.

## 3. Suspending a Tune ("Kill Switch")
If a bad tune is discovered in the wild:
1.  **Admin Panel**: Go to Tune Version.
2.  **Action**: Set Status to `SUSPENDED`.
3.  **Result**:
    *   `DownloadLinkView` immediately starts returning 403.
    *   New users cannot buy it.
    *   Existing owners cannot download it.

## 4. Manual Review
1.  Go to `/admin/tuner/applications/`.
2.  Review "Pending" apps.
3.  Click "Approve" -> Triggers Profile Creation.

## 5. Verification Checklist (Dev)
*   [ ] `python manage.py test marketplace` -> All Pass
*   [ ] Upload `test.zip` -> `quarantine/`
*   [ ] Celery Log: "Validation Passed"
*   [ ] DB: Version is `READY_FOR_REVIEW`
*   [ ] Admin: Approve
*   [ ] Download Link: Returns Signed URL (200 OK)
