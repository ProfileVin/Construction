/** Save a fetched blob as a file (authed endpoints can't be plain `<a href>` links — they need the bearer header). */
export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

/**
 * Open a fetched blob in a new tab. The tab is opened synchronously (before the fetch) so popup
 * blockers treat it as user-initiated, then pointed at the blob. Rejects if the fetch fails.
 */
export async function openBlobInNewTab(fetchBlob: () => Promise<Blob>) {
  const tab = window.open('', '_blank')
  try {
    const url = URL.createObjectURL(await fetchBlob())
    if (tab) {
      tab.opener = null
      tab.location.href = url
    } else {
      window.location.assign(url)
    }
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
  } catch (error) {
    tab?.close()
    throw error
  }
}
