const del = import('del');

const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const childProcess = require('child_process')
const gulp = require('gulp');
const $ = require('gulp-util')
const through2 = require('through2');

function build_latex() {
    return gulp.src('src/**/main.tex')
        .pipe(through2.obj(function (file, enc, cb) {
            let stdout = '', stderr = '', finalError = null;
            const pdflatex = childProcess.spawn('lualatex', [
                '-synctex=1',
                '-interaction=nonstopmode',
                "-file-line-error",
                "-shell-escape",
                `-output-directory=${file.dirname}`,
                file.path
            ], {
                cwd: file.dirname,
            })
            $.log($.colors.red('Lualatex Execute: '), $.colors.cyan(pdflatex.spawnargs.join(" ")));
            pdflatex.stdout.on('data', data => { stdout += data })
            pdflatex.stderr.on('data', data => { stderr += data })
            pdflatex.on('close', () => {
                const pathObject = path.parse(file.path)
                const outputPath = path.join(file.dirname, `${pathObject.name}.pdf`)
                if (file.isStream()) {
                    try {
                        file.contents = fs.createReadStream(outputPath)
                    } catch (readStreamError) {
                        finalError = readStreamError
                    }
                } else if (file.isBuffer()) {
                    try {
                        file.contents = fs.readFileSync(outputPath)
                    } catch (readFileError) {
                        finalError = readFileError
                    }
                } else {
                    finalError = `Error compiling ${file.path}!`
                }

                if (finalError) {
                    $.log($.colors.red('Error compiling'), $.colors.cyan(file.path))
                    $.log($.colors.red('latex output:'), `\n${stdout}${stderr}`)
                } else {
                    file.path = file.dirname + "/main.pdf";
                    $.log($.colors.green('latex output:'), `\n${stdout}`)
                    $.log($.colors.green('Compiled'), $.colors.cyan(file.path))
                }

                cb(finalError ? new $.PluginError("latex", finalError) : null, file)
            });
        }))
        .pipe(gulp.dest('./public/pdf/'));
}

function clean() {
    return del.then(del => del.deleteSync([
        'src/**/*.aux',
        'src/**/*.bbl',
        'src/**/*.bcf',
        'src/**/*.blg',
        'src/**/*.fdb_latexmk',
        'src/**/*.fls',
        'src/**/*.log',
        'src/**/*.out',
        'src/**/*.run.xml',
        'src/**/*.synctex.gz',
        'src/**/*.toc',
        'src/**/*.log',
        'src/**/*.pdf',
    ]));
}

exports.build = gulp.series(clean, build_latex);
exports.clean = gulp.series(clean);