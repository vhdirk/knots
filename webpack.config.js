const webpack = require("@nativescript/webpack");
const NgCompilerPlugin = require("@ngtools/webpack");
const { NativeScriptWorkerPlugin } = require("nativescript-worker-loader/NativeScriptWorkerPlugin");

module.exports = (env) => {
	webpack.init(env);

	// Learn how to customize:
	// https://docs.nativescript.org/webpack

  webpack.Utils.addCopyRule({
    from: 'nodecycler-data/dist/',
    to: 'nodecycler-data',
    // the context of the "from" rule, in this case node_modules
    // we used the getProjectFilePath util here, but this could have been
    // a path.resolve(__dirname, 'node_modules') too.
    context: webpack.Utils.project.getProjectFilePath('node_modules')
  })

	return webpack.resolveConfig();
};


