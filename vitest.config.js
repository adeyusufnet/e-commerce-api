import { defineConfig } from "vitest/config"
import dotenv from "dotenv";

const testEnv = dotenv.config({ path: ".env.test" }).parsed;

export default defineConfig({
    test: {
        env: testEnv,
        setupFiles: ['./src/tests/setup.js'],
        fileParallelism: false //file test dijalankan bergantian karena berbagi 1 database
    }
})