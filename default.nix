{
  buildNpmPackage,
  importNpmLock,
  lib,
}:
buildNpmPackage (finalAttrs: {
  inherit (finalAttrs.npmDeps) pname version;
  inherit (importNpmLock) npmConfigHook;
  npmDeps = importNpmLock { npmRoot = finalAttrs.src; };

  # Only the build inputs, so that unrelated changes do not trigger a rebuild.
  src = lib.fileset.toSource {
    root = ./.;
    fileset = lib.fileset.unions [
      ./index.html
      ./package-lock.json
      ./package.json
      ./public
      ./src
      ./tsconfig.app.json
      ./tsconfig.json
      ./tsconfig.node.json
      ./vite.config.ts
    ];
  };

  installPhase = ''
    runHook preInstall

    cp -r dist/app "$out"

    runHook postInstall
  '';

  meta = {
    description = "Convert arguments in plain texts (e.g., newspaper articles) to structured argument graphs";
    license = lib.licenses.mit;
    maintainers = with lib.maintainers; [ mirkolenz ];
    homepage = "https://github.com/recap-utr/arguemapper";
  };
})
