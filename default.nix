{
  buildNpmPackage,
  importNpmLock,
  nodejs,
  lib,
}:
buildNpmPackage (finalAttrs: {
  inherit (finalAttrs.npmDeps) pname version;
  inherit (importNpmLock) npmConfigHook;
  npmDeps = importNpmLock { npmRoot = finalAttrs.src; };

  src = ./.;
  installPhase = ''
    runHook preInstall

    mkdir -p "$out"
    cp -r "dist/app/." "$out"

    runHook postInstall
  '';

  meta = with lib; {
    description = "Convert arguments in plain texts (e.g., newspaper articles) to structured argument graphs";
    license = licenses.mit;
    maintainers = with maintainers; [ mirkolenz ];
    homepage = "https://github.com/recap-utr/arguemapper";
  };
})
