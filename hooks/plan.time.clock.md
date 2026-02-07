# Plan Time Clock

## expected behavior
- api first time entry get
- api should always be the source of truth
    - every page refresh api should be called
    - every user user action api should be called
- local storage is invalidated if api response date is no longer the same
    - if no local storage value recreate from api response
- api response for every call should be synced with local storage
