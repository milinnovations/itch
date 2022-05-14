import shelljs from "shelljs";

try {
    const destination: string | undefined = process.env.npm_config_destination;

    if (destination === "" || destination === undefined) {
        throw new Error(`Destionation is empty, please use the --destination option to set it`);
    }

    console.log(`Destination: "${destination}"`);
    console.log();

    console.log(`Running build...`);
    console.log();

    if (shelljs.exec(`npm run build`).code !== 0) {
        throw new Error(`Error while building the source code`);
    }

    console.log(`Making the folder...`);
    console.log();

    if (shelljs.mkdir("-p", `${destination}/node_modules/@mil/itch`).code !== 0) {
        throw new Error(`Error while creating the folder`);
    }

    console.log(`Copying files into the destination...`);
    console.log();

    if (
        shelljs.cp(
            `-rf`,
            [`./lib`, `./src`, `./package.json`, `./LICENSE`, `./README.md`],
            `${destination}/node_modules/@mil/itch`,
        ).code !== 0
    ) {
        throw new Error(`Error while copying files into the destination`);
    }

    console.log(`Done.`);
} catch (error) {
    console.log(String(error));
    shelljs.exit(1);
}
