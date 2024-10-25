{
  buildNpmPackage,
  importNpmLock,
  nodejs,
  xcbuild,
  stdenv,
  lib,
}:
let
  npmDeps = importNpmLock {
    npmRoot = ./.;
  };
in
buildNpmPackage {
  inherit npmDeps;
  inherit (npmDeps) pname version;
  inherit (importNpmLock) npmConfigHook;

  src = ./.;
  installPhase = ''
    runHook preInstall

    mkdir -p "$out"
    cp -r "dist/." "$out"

    runHook postInstall
  '';

  # Python is needed for node-gyp/libsass
  nativeBuildInputs = [
    (nodejs.passthru.python.withPackages (ps: with ps; [ setuptools ]))
  ] ++ (lib.optional stdenv.hostPlatform.isDarwin xcbuild);

  meta = with lib; {
    description = "Convert arguments in plain texts (e.g., newspaper articles) to structured argument graphs";
    license = licenses.mit;
    maintainers = with maintainers; [ mirkolenz ];
    homepage = "https://github.com/recap-utr/arguemapper";
  };
}
