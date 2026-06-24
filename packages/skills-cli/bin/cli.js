#!/usr/bin/env node
import { installAdHocSkill } from '../src/installer.js';

const args = process.argv.slice(2);
const command = args[0];
const target = args[1];

if (command === 'add' && target) {
    const targetProjectDir = process.cwd();
    console.log(`Installing skill ${target} into ${targetProjectDir}...`);
    installAdHocSkill(target, targetProjectDir)
        .then(res => {
            if (res.success) {
                console.log(`Successfully installed skill: ${res.registeredSkill}`);
            } else {
                console.error(`Failed to install skill.`);
            }
        })
        .catch(err => {
            console.error(err.message);
            process.exit(1);
        });
} else {
    console.log("Usage: npx skills add <github-repo>");
}
