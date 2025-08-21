export function extractUserNameAndTimestamp(notes: string[]): { message: string; userName: string | null; timestamp: string | null }[] {
  const regex = /\(added by\s+([^\)]+)\s+at\s+([^\)]+)\)/;

  return notes.map(noteText => {
    const match = noteText.match(regex);

    // If the match is found, extract the userName and timestamp
    if (match) {
      const userName = match[1];  // Extracted user name
      const timestamp = match[2]; // Extracted timestamp
      // Remove the "(added by ... at timestamp)" part to get the message
      const message = noteText.replace(regex, '').trim();
      return { message, userName, timestamp };
    } else {
      // If the format is incorrect, return null values for userName and timestamp, and the original message
      return { message: noteText, userName: null, timestamp: null };
    }
  });
}
