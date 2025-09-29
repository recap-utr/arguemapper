{
  buildNpmPackage,
  importNpmLock,
  nodejs,
  xcbuild,
  stdenv,
  lib,
  biome,
}:
let
in
buildNpmPackage (finalAttrs: {
  inherit (finalAttrs.npmDeps) pname version;
  inherit (importNpmLock) npmConfigHook;
  npmDeps = importNpmLock { npmRoot = finalAttrs.src; };

  src = ./.;
  installPhase = ''
    runHook preInstall

    mkdir -p "$out"
    cp -r "dist/." "$out"

    runHook postInstall
  '';

  BIOME_BINARY = lib.getExe biome;

  # Python is needed for node-gyp/libsass
  nativeBuildInputs = [
    (nodejs.passthru.python.withPackages (ps: with ps; [ setuptools ]))
  ]
  ++ (lib.optional stdenv.hostPlatform.isDarwin xcbuild);

  meta = with lib; {
    description = "Convert arguments in plain texts (e.g., newspaper articles) to structured argument graphs";
    license = licenses.mit;
    maintainers = with maintainers; [ mirkolenz ];
    homepage = "https://github.com/recap-utr/arguemapper";
  };
})
