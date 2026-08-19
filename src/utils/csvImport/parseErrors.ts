export class PdfPasswordError extends Error {
  readonly incorrect: boolean

  constructor(incorrect: boolean) {
    super(
      incorrect
        ? 'That password did not work'
        : 'This statement is locked. Enter the password from your bank.',
    )
    this.name = 'PdfPasswordError'
    this.incorrect = incorrect
  }
}
