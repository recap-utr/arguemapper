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

  # Python is needed for node-gyp/libsass
  nativeBuildInputs = [
    (nodejs.passthru.python.withPackages (ps: with ps; [ setuptools ]))
  ] ++ (lib.optional stdenv.hostPlatform.isDarwin xcbuild);

  meta = { };
}
