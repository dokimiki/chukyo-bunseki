#!/usr/bin/env bun

import { command, run, string, option, subcommands } from "cmd-ts";

const loginCommand = command({
    name: "login",
    description: "Login to Chukyo Manabo/ALBO and save session state",
    args: {
        username: option({
            type: string,
            long: "username",
            short: "u",
            description: "Student ID",
            env: "CHUKYO_USERNAME",
        }),
        password: option({
            type: string,
            long: "password",
            short: "p",
            description: "Password",
            env: "CHUKYO_PASSWORD",
        }),
    },
    handler: async ({ username, password }) => {
        console.log("Starting login process...");
        // TODO: Implement Playwright login logic
        console.log(`Username: ${username ? "[PROVIDED]" : "[NOT PROVIDED]"}`);
        console.log(`Password: ${password ? "[PROVIDED]" : "[NOT PROVIDED]"}`);
    },
});

const screenshotCommand = command({
    name: "screenshot",
    description: "Take screenshot via MCP service",
    args: {},
    handler: async () => {
        console.log("Taking screenshot...");
        // TODO: Implement MCP service call
    },
});

const app = subcommands({
    name: "chukyo-cli",
    description: "Chukyo University analysis tools",
    cmds: {
        login: loginCommand,
        screenshot: screenshotCommand,
    },
});

run(app, process.argv.slice(2));
