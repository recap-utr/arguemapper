# https://devenv.sh/reference/options/
{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixpkgs-unstable";
    systems.url = "github:nix-systems/default";
    flake-parts.url = "github:hercules-ci/flake-parts";
    npmlock2nix = {
      url = "github:nix-community/npmlock2nix";
      flake = false;
    };
  };
  outputs = inputs @ {
    nixpkgs,
    flake-parts,
    systems,
    npmlock2nix,
    ...
  }:
    flake-parts.lib.mkFlake {inherit inputs;} {
      systems = import systems;
      perSystem = {
        pkgs,
        system,
        ...
      }: {
        _module.args.pkgs = import inputs.nixpkgs {
          inherit system;
          overlays = [
            (final: prev: {
              npmlock2nix = import npmlock2nix {pkgs = prev;};
            })
          ];
        };
        devShells.default = pkgs.mkShell {
          shellHook = "npm install";
          packages = with pkgs; [nodejs-18_x];
        };
        packages = let
          app = pkgs.npmlock2nix.v2.build {
            src = ./.;
            installPhase = "cp -r dist $out";
            buildCommands = ["npm run build"];
            node_modules_attrs = {
              nodejs = pkgs.nodejs-18_x;
            };
          };
        in {
          default = app;
          arguemapper = app;
        };
      };
    };
}
