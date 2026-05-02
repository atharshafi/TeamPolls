import app from '../app.js'

// This file is shared by all test files
// Think of it like the "before school / after school" routine:
// - Before tests: start the server
// - After tests: shut it down cleanly

export async function buildApp() {
  await app.ready()  // wait for all plugins to connect
  return app
}

export async function closeApp() {
  await app.close()  // shut everything down cleanly
}