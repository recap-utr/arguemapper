{
  npmlock2nix,
  nodejs,
  python3,
}:
npmlock2nix.v2.build {
  src = ./.;
  installPhase = ''
    runHook preInstall

    mkdir -p $out
    cp -r dist/. $out

    runHook postInstall
  '';
  preBuild = ''
    export HOME=$TMPDIR
  '';
  node_modules_attrs = {
    inherit nodejs;
    # Python is needed for node-gyp/libsass
    buildInputs = [ (python3.withPackages (p: with p; [ setuptools ])) ];
  };
}
