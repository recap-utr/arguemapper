{
  treefmt,
  mkShell,
  nodejs,
  lib,
}:
mkShell {
  shellHook = ''
    ${lib.getExe' nodejs "npm"} install
    ${lib.getExe nodejs} --version > .node-version
  '';
  packages = [
    nodejs
    treefmt
  ];
}
